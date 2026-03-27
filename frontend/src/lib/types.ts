export type Posicao = "linha" | "goleiro"
export type Presenca = "pendente" | "presente" | "ausente"

export interface Player {
  id: string
  nome: string
  posicao: Posicao
  presenca: Presenca
  top_player: boolean
  is_admin: boolean
  is_avulso: boolean
  is_especial: boolean
  time: string | null
}

export interface SorteioResult {
  done: boolean
  times: Record<string, Player[]>
  reservas?: Player[]
  date: string | null
  reset_count?: number
}

export interface AppConfig {
  sorteio_date: string | null
  sorteio_done: boolean
  filtro_especial?: boolean
  society?: boolean
  reset_count?: number
}

export const TIME_COLORS: Record<string, string> = {
  Amarelo: "time-amarelo",
  Azul: "time-azul",
  Verde: "time-verde",
  Vermelho: "time-vermelho",
  Branco: "text",
}

export const TIME_NAMES = ["Amarelo", "Azul", "Verde", "Vermelho", "Branco"] as const
