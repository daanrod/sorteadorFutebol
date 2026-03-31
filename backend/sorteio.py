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


def _distribuir_simples(jogadores: list[dict], times: dict[str, list[dict]], max_por_time: int) -> list[dict]:
    """Distribui jogadores nos times com vaga. Goleiros não vão pra time que já tem goleiro."""
    sobras = []
    random.shuffle(jogadores)
    for jogador in jogadores:
        is_gol = jogador.get("posicao") == "goleiro"
        is_esp = jogador.get("is_especial", False)
        disponiveis = [
            t for t in times
            if len(times[t]) < max_por_time
            and (not is_gol or not _time_tem_goleiro(times[t]))
            and (not is_esp or not _time_tem_especial(times[t]))
        ]
        # Se gordinho e todos os times já têm gordinho, vai pra qualquer com vaga
        if not disponiveis and is_esp and not is_gol:
            disponiveis = [t for t in times if len(times[t]) < max_por_time]
        if not disponiveis:
            sobras.append(jogador)
            continue
        disponiveis.sort(key=lambda t: len(times[t]))
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

    # Calcular número de times
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

    # 3. Especiais (máx 1 por time)
    if filtro_especial and especiais:
        random.shuffle(especiais)
        for esp in especiais:
            sem_esp = [
                t for t in nomes_times
                if not _time_tem_especial(times[t]) and len(times[t]) < max_por_time
            ]
            if not sem_esp:
                normais.append(esp)
                continue
            sem_esp.sort(key=lambda t: len(times[t]))
            esp["time"] = sem_esp[0]
            times[sem_esp[0]].append(esp)

    # 4. Jogadores normais
    _distribuir_simples(normais, times, max_por_time)

    # 5. Avulsos por último
    _distribuir_simples(avulsos, times, max_por_time)

    # Ordenar cada time: goleiro primeiro
    for nome in nomes_times:
        times[nome] = _ordenar_time(times[nome])

    return times
