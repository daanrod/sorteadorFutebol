export type Posicao = "linha" | "goleiro"
export type Presenca = "pendente" | "presente" | "ausente"

export interface Player {
  id: string
  nome: string
  posicao: Posicao
  presenca: Presenca
  top_player: boolean
  time: string | null
}

export interface SorteioResult {
  done: boolean
  times: Record<string, Player[]>
  date: string | null
}

export interface AppConfig {
  sorteio_date: string | null
  sorteio_done: boolean
}

export const TIME_COLORS: Record<string, string> = {
  Amarelo: "time-amarelo",
  Azul: "time-azul",
  Verde: "time-verde",
  Vermelho: "time-vermelho",
}

export const TIME_NAMES = ["Amarelo", "Azul", "Verde", "Vermelho"] as const
