import type { Player } from "./types"

const ORDEM_BASE = ["Amarelo", "Azul", "Verde", "Vermelho"]

function ordemIndex(nome: string): number {
  const baseIdx = ORDEM_BASE.indexOf(nome)
  if (baseIdx >= 0) return baseIdx
  // Branco, Branco 2, Branco 3... sempre depois dos 4 principais
  if (nome.startsWith("Branco")) return 100 + (parseInt(nome.replace(/\D/g, "") || "1") || 1)
  if (nome === "Reserva") return 999
  return 200
}

export function timesOrdenados(times: Record<string, Player[]>): [string, Player[]][] {
  return Object.entries(times).sort((a, b) => ordemIndex(a[0]) - ordemIndex(b[0]))
}

export function teamAccent(nome: string): string {
  const map: Record<string, string> = {
    Amarelo: "border-l-time-amarelo",
    Azul: "border-l-time-azul",
    Verde: "border-l-time-verde",
    Vermelho: "border-l-time-vermelho",
  }
  if (nome === "Reserva") return "border-l-faint"
  return map[nome] || "border-l-time-branco"
}

export function teamBadge(nome: string): string {
  const map: Record<string, string> = {
    Amarelo: "bg-time-amarelo/15 text-time-amarelo",
    Azul: "bg-time-azul/15 text-time-azul",
    Verde: "bg-time-verde/15 text-time-verde",
    Vermelho: "bg-time-vermelho/15 text-time-vermelho",
  }
  if (nome === "Reserva") return "bg-faint/30 text-text-muted"
  return map[nome] || "bg-time-branco/15 text-time-branco"
}
