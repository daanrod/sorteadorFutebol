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
async def test_create_player_requires_admin(client):
    r = await client.post("/api/players", json={"nome": "João", "posicao": "linha"})
    assert r.status_code == 401


@pytest.mark.anyio
async def test_create_player(admin_client):
    r = await admin_client.post("/api/players", json={"nome": "João", "posicao": "linha"})
    assert r.status_code == 200
    data = r.json()
    assert data["nome"] == "João"
    assert data["posicao"] == "linha"
    assert data["presenca"] == "pendente"
    assert data["top_player"] is False


@pytest.mark.anyio
async def test_create_duplicate_player(admin_client):
    await admin_client.post("/api/players", json={"nome": "João", "posicao": "linha"})
    r = await admin_client.post("/api/players", json={"nome": "João", "posicao": "linha"})
    assert r.status_code == 400


@pytest.mark.anyio
async def test_create_goleiro(admin_client):
    r = await admin_client.post("/api/players", json={"nome": "Marcos", "posicao": "goleiro"})
    assert r.status_code == 200
    assert r.json()["posicao"] == "goleiro"


@pytest.mark.anyio
async def test_list_players(admin_client):
    await admin_client.post("/api/players", json={"nome": "A", "posicao": "linha"})
    await admin_client.post("/api/players", json={"nome": "B", "posicao": "goleiro"})
    r = await admin_client.get("/api/players")
    assert r.status_code == 200
    assert len(r.json()) == 2


@pytest.mark.anyio
async def test_update_player(admin_client):
    r = await admin_client.post("/api/players", json={"nome": "João", "posicao": "linha"})
    pid = r.json()["id"]
    r = await admin_client.patch(f"/api/players/{pid}", json={"top_player": True})
    assert r.status_code == 200
    assert r.json()["top_player"] is True


@pytest.mark.anyio
async def test_delete_player(admin_client):
    r = await admin_client.post("/api/players", json={"nome": "João", "posicao": "linha"})
    pid = r.json()["id"]
    r = await admin_client.delete(f"/api/players/{pid}")
    assert r.status_code == 200
    players = (await admin_client.get("/api/players")).json()
    assert len(players) == 0


@pytest.mark.anyio
async def test_player_login_and_presenca(admin_client):
    # Admin cria jogador
    r = await admin_client.post("/api/players", json={"nome": "Carlos", "posicao": "linha"})
    assert r.status_code == 200

    # Jogador faz login
    r = await admin_client.post("/api/login", json={"nome": "Carlos"})
    assert r.status_code == 200
    assert r.json()["player"]["nome"] == "Carlos"

    # Jogador confirma presença
    r = await admin_client.patch("/api/presenca/presente")
    assert r.status_code == 200
    assert r.json()["presenca"] == "presente"


@pytest.mark.anyio
async def test_player_login_not_found(client):
    r = await client.post("/api/login", json={"nome": "Inexistente"})
    assert r.status_code == 404
