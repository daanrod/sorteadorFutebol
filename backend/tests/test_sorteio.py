import pytest


async def _create_players(client, count=20, goleiros=2, especiais=0):
    """Helper: cria jogadores via autocadastro e marca presença."""
    await client.post("/api/admin/login", json={"senha": "admin123"})

    for i in range(count):
        if i < goleiros:
            posicao = "goleiro"
        else:
            posicao = "linha"
        is_especial = i >= (count - especiais) if especiais else False

        r = await client.post("/api/login", json={
            "nome": f"Player{i}",
            "posicao": posicao,
            "is_especial": is_especial,
        })
        # Marcar presente
        await client.patch("/api/presenca/presente")

        # Top players (primeiros 4)
        if i < 4:
            pid = r.json()["player"]["id"]
            await client.patch(f"/api/players/{pid}", json={"top_player": True})


@pytest.mark.anyio
async def test_sorteio_futsal(admin_client):
    await _create_players(admin_client, count=20, goleiros=2)

    r = await admin_client.post("/api/sorteio")
    assert r.status_code == 200
    data = r.json()
    assert "times" in data

    # 20/5 = 4 times
    assert len(data["times"]) == 4
    for jogadores in data["times"].values():
        assert len(jogadores) == 5


@pytest.mark.anyio
async def test_sorteio_society(admin_client):
    await _create_players(admin_client, count=18, goleiros=2)
    # Ativar society
    await admin_client.post("/api/admin/toggle-society")

    r = await admin_client.post("/api/sorteio")
    assert r.status_code == 200
    data = r.json()
    # 18/6 = 3 times
    assert len(data["times"]) == 3


@pytest.mark.anyio
async def test_sorteio_poucas_pessoas(admin_client):
    await client_post_login(admin_client, "A", "linha")
    await client_post_login(admin_client, "B", "linha")
    r = await admin_client.post("/api/sorteio")
    assert r.status_code == 400


async def client_post_login(client, nome, posicao):
    await client.post("/api/login", json={"nome": nome, "posicao": posicao})
    await client.patch("/api/presenca/presente")


@pytest.mark.anyio
async def test_sorteio_top_players_separados(admin_client):
    await _create_players(admin_client, count=20, goleiros=2)

    r = await admin_client.post("/api/sorteio")
    times = r.json()["times"]

    for jogadores in times.values():
        tops = [j for j in jogadores if j.get("top_player")]
        assert len(tops) <= 1


@pytest.mark.anyio
async def test_sorteio_max_1_goleiro_por_time(admin_client):
    await _create_players(admin_client, count=20, goleiros=4)

    r = await admin_client.post("/api/sorteio")
    times = r.json()["times"]

    for jogadores in times.values():
        gols = [j for j in jogadores if j.get("posicao") == "goleiro"]
        assert len(gols) <= 1


@pytest.mark.anyio
async def test_sorteio_reservas(admin_client):
    await _create_players(admin_client, count=22, goleiros=2)

    r = await admin_client.post("/api/sorteio")
    data = r.json()
    # 22/5 = 4 times (20), sobra 2 < 5 = reservas
    assert len(data["times"]) == 4
    # Reservas via GET
    r = await admin_client.get("/api/sorteio")
    assert len(r.json()["reservas"]) == 2


@pytest.mark.anyio
async def test_reset_sorteio(admin_client):
    await _create_players(admin_client, count=10, goleiros=2)
    await admin_client.post("/api/sorteio")

    r = await admin_client.get("/api/sorteio")
    assert r.json()["done"] is True

    await admin_client.post("/api/admin/reset-sorteio")
    r = await admin_client.get("/api/sorteio")
    assert r.json()["done"] is False


@pytest.mark.anyio
async def test_reset_all(admin_client):
    await _create_players(admin_client, count=10, goleiros=2)
    await admin_client.post("/api/admin/reset-all")

    players = (await admin_client.get("/api/players")).json()
    assert len(players) == 0


@pytest.mark.anyio
async def test_delete_resets_sorteio(admin_client):
    await _create_players(admin_client, count=10, goleiros=2)
    await admin_client.post("/api/sorteio")

    r = await admin_client.get("/api/sorteio")
    assert r.json()["done"] is True

    players = (await admin_client.get("/api/players")).json()
    await admin_client.delete(f"/api/players/{players[0]['id']}")

    r = await admin_client.get("/api/sorteio")
    assert r.json()["done"] is False
