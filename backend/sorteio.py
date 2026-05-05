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
    """Distribui jogadores normais — balanceado (menor primeiro). Goleiro nunca duplica."""
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
        # Time com menos jogadores primeiro (balanceado)
        disponiveis.sort(key=lambda t: len(times[t]))
        jogador["time"] = disponiveis[0]
        times[disponiveis[0]].append(jogador)
    return sobras


def sortear(
    players: list[dict],
    filtro_especial: bool = False,
    society: bool = False,
    goleiros_fixos: bool = False,
) -> dict[str, list[dict]]:
    """
    Sorteia jogadores presentes em times.

    Quando goleiros_fixos=True:
    - Goleiros NÃO entram nos times, ficam num grupo separado (rotativo)
    - Times só têm jogadores de linha
    - Times: 4/time (futsal) ou 5/time (society)

    Ordem normal:
    1. Top players (1 por time)
    2. Goleiros (máx 1 por time — excedentes viram RESERVA)
    3. Gordinhos (balanceado)
    4. Jogadores normais
    5. Avulsos
    """
    presentes = [p for p in players if p.get("presenca") == "presente"]
    base_por_time = JOGADORES_SOCIETY if society else JOGADORES_FUTSAL
    # Com goleiros fixos, times têm 1 a menos (sem o goleiro)
    max_por_time = (base_por_time - 1) if goleiros_fixos else base_por_time

    if len(presentes) < 4:
        raise ValueError("Mínimo de 4 jogadores presentes para sortear")

    # Pra calcular times, considera só quem vai ser distribuído (sem goleiros se fixos)
    if goleiros_fixos:
        nao_goleiros = [p for p in presentes if p.get("posicao") != "goleiro"]
        num_times = max(2, len(nao_goleiros) // max_por_time)
    else:
        num_times = max(2, len(presentes) // max_por_time)

    nomes_times = _gerar_nomes_times(num_times)
    times: dict[str, list[dict]] = {t: [] for t in nomes_times}

    # Separar por tipo
    tops = [p for p in presentes if p.get("top_player") and not p.get("is_avulso") and (not goleiros_fixos or p.get("posicao") != "goleiro")]
    goleiros = [p for p in presentes if p.get("posicao") == "goleiro" and not p.get("top_player") and not p.get("is_avulso")]
    normais = [p for p in presentes if p.get("posicao") == "linha" and not p.get("top_player") and not p.get("is_avulso")]
    avulsos = [p for p in presentes if p.get("is_avulso") and (not goleiros_fixos or p.get("posicao") != "goleiro")]

    # Avulsos goleiros e tops goleiros (caso fixo)
    if goleiros_fixos:
        avulsos_goleiros = [p for p in presentes if p.get("is_avulso") and p.get("posicao") == "goleiro"]
        tops_goleiros = [p for p in presentes if p.get("top_player") and not p.get("is_avulso") and p.get("posicao") == "goleiro"]
        goleiros.extend(avulsos_goleiros)
        goleiros.extend(tops_goleiros)

    # 1. Top players (1 por time)
    random.shuffle(tops)
    for i, top in enumerate(tops[:num_times]):
        time_nome = nomes_times[i]
        top["time"] = time_nome
        times[time_nome].append(top)
    for p in tops[num_times:]:
        p["top_player"] = False
        normais.append(p)

    # 2. Goleiros — só se NÃO for fixo
    if not goleiros_fixos:
        random.shuffle(goleiros)
        for goleiro in goleiros:
            sem_gol = [
                t for t in nomes_times
                if not _time_tem_goleiro(times[t]) and len(times[t]) < max_por_time
            ]
            if not sem_gol:
                normais.append(goleiro)
                continue
            sem_gol.sort(key=lambda t: len(times[t]))
            goleiro["time"] = sem_gol[0]
            times[sem_gol[0]].append(goleiro)
    else:
        # Goleiros fixos vão pro time especial "Goleiros"
        random.shuffle(goleiros)
        for goleiro in goleiros:
            goleiro["time"] = "Goleiros"

    # 3. Gordinhos (balanceado entre todos os times)
    if filtro_especial:
        gordinhos = [p for p in normais if p.get("is_especial")]
        normais = [p for p in normais if not p.get("is_especial")]
        _distribuir_gordinhos(gordinhos, times, max_por_time)

    # 4. Jogadores normais
    _distribuir_normais(normais, times, max_por_time)

    # 5. Avulsos por último
    _distribuir_normais(avulsos, times, max_por_time)

    # Ordenar cada time: goleiro primeiro
    for nome in nomes_times:
        times[nome] = _ordenar_time(times[nome])

    # Adicionar grupo de goleiros fixos como "time" especial
    if goleiros_fixos and goleiros:
        times["Goleiros"] = _ordenar_time(goleiros)

    return times
