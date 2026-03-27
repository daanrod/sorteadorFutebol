from datetime import date
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware

from models import (
    Player, PlayerCreate, PlayerUpdate, LoginPayload, AdminLogin,
    Presenca, SorteioResult,
)
from storage import get_all, save_all, get_config, save_config
from sorteio import sortear

app = FastAPI(title="Sorteador Futebol")

ADMIN_SENHA = "admin123"  # trocar em produção

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health ───

@app.get("/api/health")
def health():
    return {"status": "ok"}


# ─── Auth Jogador ───

@app.post("/api/login")
def login(payload: LoginPayload, response: Response):
    players = get_all("players")
    player = next((p for p in players if p["nome"].lower() == payload.nome.lower()), None)
    if not player:
        raise HTTPException(404, "Jogador não encontrado. Peça ao admin para cadastrar.")
    response.set_cookie("player_id", player["id"], httponly=True, max_age=86400 * 30)
    return {"player": player}


@app.get("/api/me")
def me(player_id: str = Cookie(None)):
    if not player_id:
        raise HTTPException(401, "Não autenticado")
    players = get_all("players")
    player = next((p for p in players if p["id"] == player_id), None)
    if not player:
        raise HTTPException(401, "Jogador não encontrado")
    return {"player": player}


@app.post("/api/logout")
def logout(response: Response):
    response.delete_cookie("player_id")
    return {"ok": True}


# ─── Auth Admin ───

@app.post("/api/admin/login")
def admin_login(payload: AdminLogin, response: Response):
    if payload.senha != ADMIN_SENHA:
        raise HTTPException(401, "Senha incorreta")
    session_id = str(uuid4())
    sessions = get_all("admin_sessions")
    sessions.append({"id": session_id})
    save_all("admin_sessions", sessions)
    response.set_cookie("admin_session", session_id, httponly=True, max_age=86400)
    return {"ok": True}


def _check_admin(admin_session: str = Cookie(None)):
    if not admin_session:
        raise HTTPException(401, "Admin não autenticado")
    sessions = get_all("admin_sessions")
    if not any(s["id"] == admin_session for s in sessions):
        raise HTTPException(401, "Sessão admin inválida")


# ─── Players CRUD ───

@app.get("/api/players")
def list_players():
    return get_all("players")


@app.post("/api/players")
def create_player(payload: PlayerCreate, admin_session: str = Cookie(None)):
    _check_admin(admin_session)
    players = get_all("players")

    if any(p["nome"].lower() == payload.nome.lower() for p in players):
        raise HTTPException(400, "Jogador com esse nome já existe")

    player = Player(
        id=str(uuid4()),
        nome=payload.nome,
        posicao=payload.posicao,
    )
    players.append(player.model_dump())
    save_all("players", players)
    return player.model_dump()


@app.patch("/api/players/{player_id}")
def update_player(player_id: str, payload: PlayerUpdate, admin_session: str = Cookie(None)):
    _check_admin(admin_session)
    players = get_all("players")
    idx = next((i for i, p in enumerate(players) if p["id"] == player_id), None)
    if idx is None:
        raise HTTPException(404, "Jogador não encontrado")

    update_data = payload.model_dump(exclude_none=True)
    players[idx].update(update_data)
    save_all("players", players)
    return players[idx]


@app.delete("/api/players/{player_id}")
def delete_player(player_id: str, admin_session: str = Cookie(None)):
    _check_admin(admin_session)
    players = get_all("players")
    players = [p for p in players if p["id"] != player_id]
    save_all("players", players)
    return {"ok": True}


# ─── Presença (jogador atualiza a própria) ───

@app.patch("/api/presenca/{presenca}")
def update_presenca(presenca: Presenca, player_id: str = Cookie(None)):
    if not player_id:
        raise HTTPException(401, "Não autenticado")
    players = get_all("players")
    idx = next((i for i, p in enumerate(players) if p["id"] == player_id), None)
    if idx is None:
        raise HTTPException(404, "Jogador não encontrado")
    players[idx]["presenca"] = presenca.value
    save_all("players", players)
    return players[idx]


# ─── Sorteio ───

@app.post("/api/sorteio")
def realizar_sorteio(admin_session: str = Cookie(None)):
    _check_admin(admin_session)
    players = get_all("players")
    try:
        times = sortear(players)
    except ValueError as e:
        raise HTTPException(400, str(e))

    # Atualizar os jogadores com o time atribuído
    all_sorted = []
    for time_nome, jogadores in times.items():
        for j in jogadores:
            j["time"] = time_nome
            all_sorted.append(j["id"])

    # Atualizar no storage
    for p in players:
        matched = None
        for time_nome, jogadores in times.items():
            for j in jogadores:
                if j["id"] == p["id"]:
                    matched = time_nome
                    break
        p["time"] = matched

    save_all("players", players)

    config = get_config()
    config["sorteio_date"] = str(date.today())
    config["sorteio_done"] = True
    save_config(config)

    return {"times": times, "date": config["sorteio_date"]}


@app.get("/api/sorteio")
def get_sorteio():
    config = get_config()
    if not config.get("sorteio_done"):
        return {"done": False, "times": {}, "date": None}

    players = get_all("players")
    times: dict[str, list] = {"Amarelo": [], "Azul": [], "Verde": [], "Vermelho": []}
    for p in players:
        if p.get("time") and p["time"] in times:
            times[p["time"]].append(p)

    return {"done": True, "times": times, "date": config.get("sorteio_date")}


# ─── Admin: Reset ───

@app.post("/api/admin/reset-sorteio")
def reset_sorteio(admin_session: str = Cookie(None)):
    _check_admin(admin_session)
    players = get_all("players")
    for p in players:
        p["time"] = None
    save_all("players", players)

    config = get_config()
    config["sorteio_done"] = False
    config["sorteio_date"] = None
    save_config(config)

    return {"ok": True}


@app.post("/api/admin/reset-presencas")
def reset_presencas(admin_session: str = Cookie(None)):
    _check_admin(admin_session)
    players = get_all("players")
    for p in players:
        p["presenca"] = "pendente"
        p["time"] = None
    save_all("players", players)

    config = get_config()
    config["sorteio_done"] = False
    config["sorteio_date"] = None
    save_config(config)

    return {"ok": True}


@app.get("/api/config")
def get_app_config():
    return get_config()
