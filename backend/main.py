import os
import asyncio
from datetime import date
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Response, Cookie, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from models import (
    Player, PlayerCreate, PlayerUpdate, LoginPayload, AdminLogin,
    Presenca, Posicao,
)
from storage import get_all, save_all, get_config, save_config
from sorteio import sortear

# Carregar .env manualmente (sem dependencia extra)
_env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(_env_path):
    with open(_env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

app = FastAPI(title="Sorteador Futebol")

ADMIN_SENHA = os.environ.get("ADMIN_SENHA", "admin123")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://sorteador-futebol.vercel.app", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── WebSocket — notifica clientes em tempo real ───

_ws_clients: list[WebSocket] = []


async def _notify_all():
    """Notifica todos os clientes conectados que houve mudança."""
    dead = []
    for ws in _ws_clients:
        try:
            await ws.send_text("update")
        except Exception:
            dead.append(ws)
    for ws in dead:
        _ws_clients.remove(ws)


def _notify():
    """Versão sync — agenda notificação no event loop."""
    try:
        loop = asyncio.get_event_loop()
        loop.create_task(_notify_all())
    except RuntimeError:
        pass


from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest


class NotifyMiddleware(BaseHTTPMiddleware):
    """Notifica WebSocket clients após qualquer escrita bem sucedida."""
    async def dispatch(self, request: StarletteRequest, call_next):
        response = await call_next(request)
        if request.method in ("POST", "PATCH", "DELETE") and response.status_code == 200:
            await _notify_all()
        return response


app.add_middleware(NotifyMiddleware)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    _ws_clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in _ws_clients:
            _ws_clients.remove(websocket)


# ─── Health ───

@app.get("/api/health")
def health():
    return {"status": "ok"}


# ─── Auth Jogador (autocadastro) ───

@app.post("/api/login")
def login(payload: PlayerCreate, response: Response):
    """Jogador entra com nome e posição. Se não existe, cria automaticamente."""
    players = get_all("players")
    player = next((p for p in players if p["nome"].lower() == payload.nome.lower()), None)

    if player:
        # Atualiza posição e especial caso tenha mudado
        player["posicao"] = payload.posicao.value
        player["is_especial"] = payload.is_especial
        save_all("players", players)
    else:
        # Autocadastro
        player = Player(
            id=str(uuid4()),
            nome=payload.nome,
            posicao=payload.posicao,
            is_especial=payload.is_especial,
        ).model_dump()
        players.append(player)
        save_all("players", players)

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


# ─── Admin se cadastrar como jogador ───

@app.post("/api/admin/register")
def admin_register(payload: PlayerCreate, response: Response, admin_session: str = Cookie(None)):
    """Admin se cadastra como jogador (com tag is_admin)."""
    _check_admin(admin_session)
    players = get_all("players")
    existing = next((p for p in players if p["nome"].lower() == payload.nome.lower()), None)

    if existing:
        existing["is_admin"] = True
        existing["posicao"] = payload.posicao.value
        existing["is_especial"] = payload.is_especial
        existing["presenca"] = "presente"
        save_all("players", players)
        response.set_cookie("admin_player_id", existing["id"], httponly=True, max_age=86400)
        return existing

    player = Player(
        id=str(uuid4()),
        nome=payload.nome,
        posicao=payload.posicao,
        is_especial=payload.is_especial,
        presenca=Presenca.PRESENTE,
        is_admin=True,
    ).model_dump()
    players.append(player)
    save_all("players", players)
    response.set_cookie("admin_player_id", player["id"], httponly=True, max_age=86400)
    return player


@app.get("/api/admin/me")
def admin_me(admin_player_id: str = Cookie(None)):
    """Retorna o jogador associado ao admin logado."""
    if not admin_player_id:
        return {"player": None}
    players = get_all("players")
    player = next((p for p in players if p["id"] == admin_player_id), None)
    return {"player": player}


@app.post("/api/admin/add-player")
def admin_add_player(payload: PlayerCreate, admin_session: str = Cookie(None)):
    """Admin cadastra jogador avulso (sem acesso ao celular)."""
    _check_admin(admin_session)
    players = get_all("players")

    if any(p["nome"].lower() == payload.nome.lower() for p in players):
        raise HTTPException(400, "Jogador com esse nome já existe")

    player = Player(
        id=str(uuid4()),
        nome=payload.nome,
        posicao=payload.posicao,
        is_especial=payload.is_especial,
        presenca=Presenca.PRESENTE,
        is_avulso=True,
    ).model_dump()
    players.append(player)
    save_all("players", players)
    return player


# ─── Players ───

@app.get("/api/players")
def list_players():
    return get_all("players")


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
    # Resetar sorteio se já foi feito (time ficaria inconsistente)
    config = get_config()
    if config.get("sorteio_done"):
        for p in players:
            p["time"] = None
        save_all("players", players)
        config["sorteio_done"] = False
        config["sorteio_date"] = None
        save_config(config)
    return {"ok": True}


# ─── Presença + Posição (jogador atualiza a própria) ───

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


@app.patch("/api/posicao/{posicao}")
def update_posicao(posicao: Posicao, player_id: str = Cookie(None)):
    if not player_id:
        raise HTTPException(401, "Não autenticado")
    players = get_all("players")
    idx = next((i for i, p in enumerate(players) if p["id"] == player_id), None)
    if idx is None:
        raise HTTPException(404, "Jogador não encontrado")
    players[idx]["posicao"] = posicao.value
    save_all("players", players)
    return players[idx]


# ─── Sorteio ───

@app.post("/api/sorteio")
def realizar_sorteio(admin_session: str = Cookie(None)):
    _check_admin(admin_session)
    players = get_all("players")
    try:
        config = get_config()
        filtro = config.get("filtro_especial", False)
        society = config.get("society", False)
        times = sortear(players, filtro_especial=filtro, society=society)
    except ValueError as e:
        raise HTTPException(400, str(e))

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
    times: dict[str, list] = {}
    reservas = []
    for p in players:
        if p.get("time"):
            if p["time"] not in times:
                times[p["time"]] = []
            times[p["time"]].append(p)
        elif p.get("presenca") == "presente":
            reservas.append(p)

    # Ordenar cada time: goleiro > top > normal > especial
    def sort_key(p):
        if p.get("posicao") == "goleiro":
            return 0
        if p.get("top_player"):
            return 1
        if p.get("is_especial"):
            return 3
        return 2

    for nome in times:
        times[nome] = sorted(times[nome], key=sort_key)

    # Reservas viram um time "Reserva" se tiver gente
    if reservas:
        reservas = sorted(reservas, key=sort_key)
        times["Reserva"] = reservas

    return {"done": True, "times": times, "reservas": [], "date": config.get("sorteio_date"), "reset_count": config.get("reset_count", 0)}


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
    config["reset_count"] = config.get("reset_count", 0) + 1
    save_config(config)

    return {"ok": True}


@app.post("/api/admin/reset-presencas")
def reset_presencas(admin_session: str = Cookie(None)):
    """Reset semanal: limpa presenças e times, mantém cadastros."""
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


@app.post("/api/admin/reset-all")
def reset_all(admin_session: str = Cookie(None)):
    """Reset total: apaga TODOS os cadastros e sorteio. Começa do zero."""
    _check_admin(admin_session)
    save_all("players", [])
    save_config({"sorteio_date": None, "sorteio_done": False})
    return {"ok": True}


@app.post("/api/admin/toggle-society")
def toggle_society(admin_session: str = Cookie(None)):
    """Alterna entre Futsal (5) e Society (6)."""
    _check_admin(admin_session)
    config = get_config()
    config["society"] = not config.get("society", False)
    save_config(config)
    return {"society": config["society"]}


@app.post("/api/admin/toggle-filtro-especial")
def toggle_filtro_especial(admin_session: str = Cookie(None)):
    """Ativa/desativa o filtro especial pro sorteio do dia."""
    _check_admin(admin_session)
    config = get_config()
    config["filtro_especial"] = not config.get("filtro_especial", False)
    save_config(config)
    return {"filtro_especial": config["filtro_especial"]}


@app.get("/api/config")
def get_app_config():
    return get_config()
