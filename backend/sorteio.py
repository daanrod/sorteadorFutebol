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


def _distribuir(jogadores: list[dict], times: dict[str, list[dict]], max_por_time: int) -> list[dict]:
    """Distribui jogadores nos times com vaga. Retorna os que não couberam."""
    sobras = []
    random.shuffle(jogadores)
    for jogador in jogadores:
        disponiveis = [t for t in times if len(times[t]) < max_por_time]
        if not disponiveis:
            sobras.append(jogador)
            continue
        disponiveis.sort(key=lambda t: len(times[t]))
        time_nome = disponiveis[0]
        jogador["time"] = time_nome
        times[time_nome].append(jogador)
    return sobras


def sortear(players: list[dict], filtro_especial: bool = False, society: bool = False) -> dict[str, list[dict]]:
    """
    Sorteia jogadores presentes em times de até 5 jogadores.
    Número de times é dinâmico baseado na quantidade de presentes.

    Ordem de prioridade:
    1. Top players (1 por time)
    2. Goleiros (máx 1 por time)
    3. Jogadores normais (linha)
    4. Avulsos (só se sobrar vaga)
    """
    presentes = [p for p in players if p.get("presenca") == "presente"]
    max_por_time = JOGADORES_SOCIETY if society else JOGADORES_FUTSAL

    if len(presentes) < 4:
        raise ValueError("Mínimo de 4 jogadores presentes para sortear")

    # Calcular número de times
    # Só cria time extra se sobrar jogadores suficientes pra um time completo
    num_times = max(2, len(presentes) // max_por_time)
    sobra = len(presentes) - (num_times * max_por_time)
    if sobra >= max_por_time:
        num_times += 1
    nomes_times = _gerar_nomes_times(num_times)

    times: dict[str, list[dict]] = {t: [] for t in nomes_times}

    # Separar por tipo
    tops = [p for p in presentes if p.get("top_player") and not p.get("is_avulso")]
    goleiros = [p for p in presentes if p.get("posicao") == "goleiro" and not p.get("top_player") and not p.get("is_avulso")]
    especiais = [p for p in presentes if p.get("is_especial") and p.get("posicao") != "goleiro" and not p.get("top_player") and not p.get("is_avulso")] if filtro_especial else []
    normais = [p for p in presentes if p.get("posicao") == "linha" and not p.get("top_player") and not p.get("is_avulso") and (not filtro_especial or not p.get("is_especial"))]
    avulsos = [p for p in presentes if p.get("is_avulso")]

    # 1. Top players (1 por time)
    random.shuffle(tops)
    for i, top in enumerate(tops[:num_times]):
        time_nome = nomes_times[i]
        top["time"] = time_nome
        times[time_nome].append(top)

    # Tops excedentes viram normais
    for p in tops[num_times:]:
        p["top_player"] = False
        normais.append(p)

    # 2. Goleiros (máx 1 por time)
    # Incluir goleiros que entraram como top player na contagem
    random.shuffle(goleiros)
    goleiros_excedentes = []

    for goleiro in goleiros:
        # Recalcular a cada iteração pra garantir consistência
        times_sem_goleiro = [
            t for t in nomes_times
            if not any(p.get("posicao") == "goleiro" for p in times[t])
            and len(times[t]) < max_por_time
        ]
        if not times_sem_goleiro:
            goleiros_excedentes.append(goleiro)
            continue
        # Pegar time com menos jogadores entre os que não tem goleiro
        times_sem_goleiro.sort(key=lambda t: len(times[t]))
        time_nome = times_sem_goleiro[0]
        goleiro["time"] = time_nome
        times[time_nome].append(goleiro)

    normais.extend(goleiros_excedentes)

    # 3. Especiais (máx 1 por time)
    if filtro_especial and especiais:
        random.shuffle(especiais)
        especiais_excedentes = []
        times_sem_especial = [t for t in nomes_times if not any(p.get("is_especial") for p in times[t])]
        random.shuffle(times_sem_especial)

        for esp in especiais:
            if not times_sem_especial:
                especiais_excedentes.append(esp)
                continue
            time_nome = times_sem_especial.pop(0)
            if len(times[time_nome]) < max_por_time:
                esp["time"] = time_nome
                times[time_nome].append(esp)
            else:
                especiais_excedentes.append(esp)

        normais.extend(especiais_excedentes)

    # 4. Jogadores normais
    _distribuir(normais, times, max_por_time)

    # 4. Avulsos por último
    _distribuir(avulsos, times, max_por_time)

    # Ordenar cada time: goleiro primeiro, depois top, depois linha
    for nome in nomes_times:
        times[nome] = _ordenar_time(times[nome])

    return times
