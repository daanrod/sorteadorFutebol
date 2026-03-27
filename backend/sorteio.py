import random
from models import Player, Posicao


TIMES = ["Amarelo", "Azul", "Verde", "Vermelho"]
MAX_POR_TIME = 5


def sortear(players: list[dict]) -> dict[str, list[dict]]:
    """
    Sorteia jogadores presentes em 4 times de até 5 jogadores.

    Regras:
    1. Top players são distribuídos primeiro (1 por time, definidos pelo admin)
    2. Goleiros são distribuídos (máx 1 por time)
    3. Jogadores de linha são sorteados aleatoriamente nos times restantes
    """
    presentes = [p for p in players if p.get("presenca") == "presente"]

    if len(presentes) < 4:
        raise ValueError("Mínimo de 4 jogadores presentes para sortear")

    times: dict[str, list[dict]] = {t: [] for t in TIMES}

    # Separar por tipo
    tops = [p for p in presentes if p.get("top_player")]
    goleiros = [p for p in presentes if p.get("posicao") == "goleiro" and not p.get("top_player")]
    linha = [p for p in presentes if p.get("posicao") == "linha" and not p.get("top_player")]

    # 1. Distribuir top players (1 por time)
    random.shuffle(tops)
    for i, top in enumerate(tops[:4]):
        time_nome = TIMES[i]
        top["time"] = time_nome
        times[time_nome].append(top)

    # Tops excedentes vão pro pool de linha
    tops_excedentes = tops[4:]
    for p in tops_excedentes:
        p["top_player"] = False
    linha.extend(tops_excedentes)

    # 2. Distribuir goleiros (máx 1 por time)
    random.shuffle(goleiros)
    times_sem_goleiro = [t for t in TIMES if not any(p.get("posicao") == "goleiro" for p in times[t])]
    random.shuffle(times_sem_goleiro)

    for goleiro in goleiros:
        if not times_sem_goleiro:
            # Goleiro excedente vai como linha
            goleiro["time"] = None
            linha.append(goleiro)
            continue
        time_nome = times_sem_goleiro.pop(0)
        if len(times[time_nome]) < MAX_POR_TIME:
            goleiro["time"] = time_nome
            times[time_nome].append(goleiro)

    # 3. Distribuir jogadores de linha aleatoriamente
    random.shuffle(linha)
    for jogador in linha:
        # Encontrar time com menos jogadores que ainda tem vaga
        times_disponiveis = [
            t for t in TIMES if len(times[t]) < MAX_POR_TIME
        ]
        if not times_disponiveis:
            break

        # Priorizar time com menos jogadores
        times_disponiveis.sort(key=lambda t: len(times[t]))
        time_nome = times_disponiveis[0]
        jogador["time"] = time_nome
        times[time_nome].append(jogador)

    return times
