from pydantic import BaseModel
from enum import Enum


class Posicao(str, Enum):
    LINHA = "linha"
    GOLEIRO = "goleiro"


class Presenca(str, Enum):
    PENDENTE = "pendente"
    PRESENTE = "presente"
    AUSENTE = "ausente"


class PlayerCreate(BaseModel):
    nome: str
    posicao: Posicao = Posicao.LINHA


class Player(BaseModel):
    id: str
    nome: str
    posicao: Posicao = Posicao.LINHA
    presenca: Presenca = Presenca.PENDENTE
    top_player: bool = False
    is_admin: bool = False
    time: str | None = None


class PlayerUpdate(BaseModel):
    nome: str | None = None
    posicao: Posicao | None = None
    presenca: Presenca | None = None
    top_player: bool | None = None


class LoginPayload(BaseModel):
    nome: str


class AdminLogin(BaseModel):
    senha: str


class SorteioResult(BaseModel):
    times: dict[str, list[Player]]
    date: str
