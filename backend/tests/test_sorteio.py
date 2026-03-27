import pytest


async def _create_players(client, count=20, goleiros=4):
    """Helper: cria jogadores e marca presença."""
    # Login admin
    await client.post("/api/admin/login", json={"senha": "admin123"})

    for i in range(count):
        posicao = "goleiro" if i < goleiros else "linha"
        r = await client.post("/api/players", json={"nome": f"Player{i}", "posicao": posicao})
        pid = r.json()["id"]

        # Marcar primeiros 4 como top player
        if i < 4:
            await client.patch(f"/api/players/{pid}", json={"top_player": True})

    # Todos presentes: login como cada um e marcar presença
    players = (await client.get("/api/players")).json()
    for p in players:
        # Simular presença via admin update
        await client.patch(f"/api/players/{p['id']}", json={"presenca": "presente"})

    return players


@pytest.mark.anyio
async def test_sorteio_completo(admin_client):
    await _create_players(admin_client, count=20, goleiros=4)

    r = await admin_client.post("/api/sorteio")
    assert r.status_code == 200
    data = r.json()
    assert "times" in data
    assert len(data["times"]) == 4

    # Cada time tem no máximo 5 jogadores
    for time_nome, jogadores in data["times"].items():
        assert len(jogadores) <= 5
        assert time_nome in ["Amarelo", "Azul", "Verde", "Vermelho"]

    # Verificar que sorteio está salvo
    r = await admin_client.get("/api/sorteio")
    assert r.json()["done"] is True


@pytest.mark.anyio
async def test_sorteio_poucas_pessoas(admin_client):
    """Sorteio com menos de 4 presentes deve falhar."""
    await admin_client.post("/api/players", json={"nome": "A", "posicao": "linha"})
    await admin_client.post("/api/players", json={"nome": "B", "posicao": "linha"})

    players = (await admin_client.get("/api/players")).json()
    for p in players:
        await admin_client.patch(f"/api/players/{p['id']}", json={"presenca": "presente"})

    r = await admin_client.post("/api/sorteio")
    assert r.status_code == 400


@pytest.mark.anyio
async def test_sorteio_top_players_distribuidos(admin_client):
    await _create_players(admin_client, count=20, goleiros=4)

    r = await admin_client.post("/api/sorteio")
    times = r.json()["times"]

    # Cada time deve ter no máximo 1 top player
    for jogadores in times.values():
        tops = [j for j in jogadores if j.get("top_player")]
        assert len(tops) <= 1


@pytest.mark.anyio
async def test_sorteio_max_1_goleiro_por_time(admin_client):
    await _create_players(admin_client, count=20, goleiros=4)

    r = await admin_client.post("/api/sorteio")
    times = r.json()["times"]

    for jogadores in times.values():
        goleiros = [j for j in jogadores if j.get("posicao") == "goleiro"]
        assert len(goleiros) <= 1


@pytest.mark.anyio
async def test_reset_sorteio(admin_client):
    await _create_players(admin_client, count=8, goleiros=2)

    await admin_client.post("/api/sorteio")
    r = await admin_client.get("/api/sorteio")
    assert r.json()["done"] is True

    await admin_client.post("/api/admin/reset-sorteio")
    r = await admin_client.get("/api/sorteio")
    assert r.json()["done"] is False


@pytest.mark.anyio
async def test_reset_presencas(admin_client):
    await _create_players(admin_client, count=8, goleiros=2)

    await admin_client.post("/api/admin/reset-presencas")
    players = (await admin_client.get("/api/players")).json()
    for p in players:
        assert p["presenca"] == "pendente"
        assert p["time"] is None
