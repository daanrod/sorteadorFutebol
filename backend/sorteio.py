import math
import random


CORES_BASE = ["Amarelo", "Azul", "Verde", "Vermelho"]
JOGADORES_FUTSAL = 5
JOGADORES_SOCIETY = 6


def _gerar_nomes_times(num_times: int) -> list[str]:
    """Gera nomes dos times. Os 4 primeiros são as cores base, extras são Branco, Branco 2, etc."""
    nomes = CORES_BASE[:min(num_times, 4)]
    extras = num_times - len(nomes)
    for i in range(extras):
        nomes.append(f"Branco{f' {i + 1}' if i > 0 else ''}")
    return nomes


def _ordenar_time(jogadores: list[dict]) -> list[dict]:
    """Goleiros primeiro, depois top players, depois linha, especiais por último."""
    def sort_key(p):
        if p.get("posicao") == "goleiro":
            return 0
        if p.get("top_player"):
            return 1
        if p.get("is_especial"):
            return 3
        return 2
    return sorted(jogadores, key=sort_key)


def _time_tem_goleiro(jogadores: list[dict]) -> bool:
    return any(p.get("posicao") == "goleiro" for p in jogadores)


def _time_tem_especial(jogadores: list[dict]) -> bool:
    return any(p.get("is_especial") for p in jogadores)


def _distribuir_gordinhos(jogadores: list[dict], times: dict[str, list[dict]], max_por_time: int) -> list[dict]:
    """Distribui gordinhos balanceados entre os times (time com menos gordinhos primeiro)."""
    sobras = []
    random.shuffle(jogadores)
    for jogador in jogadores:
        disponiveis = [t for t in times if len(times[t]) < max_por_time]
        if not disponiveis:
            sobras.append(jogador)
            continue
        # Time com menos gordinhos
        min_gord = min(sum(1 for p in times[t] if p.get("is_especial")) for t in disponiveis)
        melhores = [t for t in disponiveis if sum(1 for p in times[t] if p.get("is_especial")) == min_gord]
        # Entre os com menos gordinhos, pegar o com menos jogadores
        melhores.sort(key=lambda t: len(times[t]))
        jogador["time"] = melhores[0]
        times[melhores[0]].append(jogador)
    return sobras


def _distribuir_normais(jogadores: list[dict], times: dict[str, list[dict]], max_por_time: int) -> list[dict]:
    """Distribui jogadores normais — preenche times maiores primeiro (enche os completos)."""
    sobras = []
    random.shuffle(jogadores)
    for jogador in jogadores:
        is_gol = jogador.get("posicao") == "goleiro"
        disponiveis = [
            t for t in times
            if len(times[t]) < max_por_time
            and (not is_gol or not _time_tem_goleiro(times[t]))
        ]
        if not disponiveis:
            sobras.append(jogador)
            continue
        # Preencher times maiores primeiro (enche os completos antes do incompleto)
        disponiveis.sort(key=lambda t: -len(times[t]))
        jogador["time"] = disponiveis[0]
        times[disponiveis[0]].append(jogador)
    return sobras


def sortear(players: list[dict], filtro_especial: bool = False, society: bool = False) -> dict[str, list[dict]]:
    """
    Sorteia jogadores presentes em times.

    Ordem de prioridade:
    1. Top players (1 por time)
    2. Goleiros (máx 1 por time — excedentes viram RESERVA, não vão pra linha)
    3. Especiais/Gordinhos (máx 1 por time se filtro ativo)
    4. Jogadores normais (linha)
    5. Avulsos (só se sobrar vaga)
    """
    presentes = [p for p in players if p.get("presenca") == "presente"]
    max_por_time = JOGADORES_SOCIETY if society else JOGADORES_FUTSAL

    if len(presentes) < 4:
        raise ValueError("Mínimo de 4 jogadores presentes para sortear")

    # Times completos + 1 incompleto se sobrar gente
    num_completos = max(2, len(presentes) // max_por_time)
    sobra = len(presentes) - (num_completos * max_por_time)
    num_times = num_completos + (1 if sobra > 0 else 0)
    nomes_times = _gerar_nomes_times(num_times)

    times: dict[str, list[dict]] = {t: [] for t in nomes_times}

    # Separar por tipo
    tops = [p for p in presentes if p.get("top_player") and not p.get("is_avulso")]
    goleiros = [p for p in presentes if p.get("posicao") == "goleiro" and not p.get("top_player") and not p.get("is_avulso")]
    normais = [p for p in presentes if p.get("posicao") == "linha" and not p.get("top_player") and not p.get("is_avulso")]
    avulsos = [p for p in presentes if p.get("is_avulso")]

    # 1. Top players (1 por time)
    random.shuffle(tops)
    for i, top in enumerate(tops[:num_times]):
        time_nome = nomes_times[i]
        top["time"] = time_nome
        times[time_nome].append(top)
    for p in tops[num_times:]:
        p["top_player"] = False
        normais.append(p)

    # 2. Goleiros (máx 1 por time)
    random.shuffle(goleiros)
    for goleiro in goleiros:
        sem_gol = [
            t for t in nomes_times
            if not _time_tem_goleiro(times[t]) and len(times[t]) < max_por_time
        ]
        if not sem_gol:
            # Excedente — joga na linha como jogador normal
            normais.append(goleiro)
            continue
        sem_gol.sort(key=lambda t: len(times[t]))
        goleiro["time"] = sem_gol[0]
        times[sem_gol[0]].append(goleiro)

    # 3. Gordinhos (balanceado entre todos os times)
    if filtro_especial:
        gordinhos = [p for p in normais if p.get("is_especial")]
        normais = [p for p in normais if not p.get("is_especial")]
        _distribuir_gordinhos(gordinhos, times, max_por_time)

    # 4. Jogadores normais (preenche times maiores primeiro)
    _distribuir_normais(normais, times, max_por_time)

    # 5. Avulsos por último
    _distribuir_normais(avulsos, times, max_por_time)

    # Ordenar cada time: goleiro primeiro
    for nome in nomes_times:
        times[nome] = _ordenar_time(times[nome])

    return times
