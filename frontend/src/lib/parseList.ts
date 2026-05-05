import type { Posicao } from "./types"

export interface ParsedPlayer {
  nome: string
  posicao: Posicao
  is_especial: boolean
}

// Emojis/marcadores que indicam goleiro
const GOLEIRO_MARKERS = ["🧤", "(gol)", "[gol]", "(goleiro)", "[goleiro]"]
// Emojis que indicam gordinho/especial (configurável)
const ESPECIAL_MARKERS = ["🍔", "🍕", "(gor)", "[gor]", "(esp)"]

/**
 * Limpa uma linha removendo numeração, bullets e espaços extras.
 * Detecta se é goleiro (🧤 ou variantes) e remove os marcadores.
 */
function cleanLine(raw: string): { nome: string; isGoleiro: boolean; isEspecial: boolean } {
  let line = raw.trim()
  if (!line) return { nome: "", isGoleiro: false, isEspecial: false }

  // Remove numeração inicial: "1.", "1)", "1 -", "1-", etc.
  line = line.replace(/^[\s•\-*•]*\d+\s*[.\)\-:]?\s*/, "")
  // Remove bullets sem numeração no começo
  line = line.replace(/^[\s•\-*•]+/, "")
  // Remove zero-width chars (whatsapp invisible chars)
  line = line.replace(/[​-‍﻿⁠ ]/g, " ")

  let isGoleiro = false
  let isEspecial = false

  // Detectar marcadores (case insensitive)
  const lower = line.toLowerCase()
  for (const marker of GOLEIRO_MARKERS) {
    if (lower.includes(marker.toLowerCase())) {
      isGoleiro = true
      // Remove o marcador da string original (case insensitive)
      const re = new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")
      line = line.replace(re, "")
    }
  }
  for (const marker of ESPECIAL_MARKERS) {
    if (lower.includes(marker.toLowerCase())) {
      isEspecial = true
      const re = new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")
      line = line.replace(re, "")
    }
  }

  return {
    nome: line.trim().replace(/\s+/g, " "),
    isGoleiro,
    isEspecial,
  }
}

export function parseList(text: string): ParsedPlayer[] {
  const lines = text.split(/\r?\n/)
  const seen = new Set<string>()
  const result: ParsedPlayer[] = []

  for (const raw of lines) {
    const { nome, isGoleiro, isEspecial } = cleanLine(raw)
    if (!nome) continue
    const key = nome.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push({
      nome,
      posicao: isGoleiro ? "goleiro" : "linha",
      is_especial: isEspecial,
    })
  }

  return result
}
