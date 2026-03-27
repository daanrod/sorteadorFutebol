import pytest


@pytest.mark.anyio
async def test_health(client):
    r = await client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


@pytest.mark.anyio
async def test_admin_login_wrong_password(client):
    r = await client.post("/api/admin/login", json={"senha": "errada"})
    assert r.status_code == 401


@pytest.mark.anyio
async def test_admin_login_success(client):
    r = await client.post("/api/admin/login", json={"senha": "admin123"})
    assert r.status_code == 200
    assert r.json()["ok"] is True


@pytest.mark.anyio
async def test_autocadastro_jogador(client):
    r = await client.post("/api/login", json={"nome": "João", "posicao": "linha"})
    assert r.status_code == 200
    data = r.json()
    assert data["player"]["nome"] == "João"
    assert data["player"]["posicao"] == "linha"
    assert data["player"]["presenca"] == "pendente"


@pytest.mark.anyio
async def test_autocadastro_goleiro(client):
    r = await client.post("/api/login", json={"nome": "Marcos", "posicao": "goleiro"})
    assert r.status_code == 200
    assert r.json()["player"]["posicao"] == "goleiro"


@pytest.mark.anyio
async def test_autocadastro_especial(client):
    r = await client.post("/api/login", json={"nome": "Carlos", "posicao": "linha", "is_especial": True})
    assert r.status_code == 200
    assert r.json()["player"]["is_especial"] is True


@pytest.mark.anyio
async def test_autocadastro_duplicado_atualiza(client):
    await client.post("/api/login", json={"nome": "João", "posicao": "linha"})
    r = await client.post("/api/login", json={"nome": "João", "posicao": "goleiro"})
    assert r.status_code == 200
    assert r.json()["player"]["posicao"] == "goleiro"


@pytest.mark.anyio
async def test_list_players(client):
    await client.post("/api/login", json={"nome": "A", "posicao": "linha"})
    await client.post("/api/login", json={"nome": "B", "posicao": "goleiro"})
    r = await client.get("/api/players")
    assert r.status_code == 200
    assert len(r.json()) == 2


@pytest.mark.anyio
async def test_presenca(client):
    r = await client.post("/api/login", json={"nome": "Carlos", "posicao": "linha"})
    r = await client.patch("/api/presenca/presente")
    assert r.status_code == 200
    assert r.json()["presenca"] == "presente"


@pytest.mark.anyio
async def test_admin_register(admin_client):
    r = await admin_client.post("/api/admin/register", json={"nome": "Admin", "posicao": "linha"})
    assert r.status_code == 200
    assert r.json()["is_admin"] is True


@pytest.mark.anyio
async def test_admin_add_avulso(admin_client):
    r = await admin_client.post("/api/admin/add-player", json={"nome": "Avulso", "posicao": "linha"})
    assert r.status_code == 200
    assert r.json()["is_avulso"] is True


@pytest.mark.anyio
async def test_delete_player_requires_admin(client):
    r = await client.post("/api/login", json={"nome": "Test", "posicao": "linha"})
    pid = r.json()["player"]["id"]
    r = await client.delete(f"/api/players/{pid}")
    assert r.status_code == 401


@pytest.mark.anyio
async def test_delete_player(admin_client):
    r = await admin_client.post("/api/login", json={"nome": "Test", "posicao": "linha"})
    pid = r.json()["player"]["id"]
    r = await admin_client.delete(f"/api/players/{pid}")
    assert r.status_code == 200
    players = (await admin_client.get("/api/players")).json()
    assert not any(p["id"] == pid for p in players)


@pytest.mark.anyio
async def test_toggle_society(admin_client):
    r = await admin_client.post("/api/admin/toggle-society")
    assert r.status_code == 200
    assert r.json()["society"] is True
    r = await admin_client.post("/api/admin/toggle-society")
    assert r.json()["society"] is False


@pytest.mark.anyio
async def test_toggle_filtro_especial(admin_client):
    r = await admin_client.post("/api/admin/toggle-filtro-especial")
    assert r.status_code == 200
    assert r.json()["filtro_especial"] is True
