import type { Player, Posicao, Presenca, SorteioResult, AppConfig } from "./types"

const BASE = "/api"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Erro ${res.status}`)
  }
  return res.json()
}

// Auth jogador
export const loginPlayer = (nome: string) =>
  request<{ player: Player }>("/login", {
    method: "POST",
    body: JSON.stringify({ nome }),
  })

export const getMe = () => request<{ player: Player }>("/me")

export const logout = () => request<{ ok: boolean }>("/logout", { method: "POST" })

// Auth admin
export const adminLogin = (senha: string) =>
  request<{ ok: boolean }>("/admin/login", {
    method: "POST",
    body: JSON.stringify({ senha }),
  })

// Players
export const getPlayers = () => request<Player[]>("/players")

export const createPlayer = (nome: string, posicao: Posicao) =>
  request<Player>("/players", {
    method: "POST",
    body: JSON.stringify({ nome, posicao }),
  })

export const updatePlayer = (id: string, data: Partial<Player>) =>
  request<Player>(`/players/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })

export const deletePlayer = (id: string) =>
  request<{ ok: boolean }>(`/players/${id}`, { method: "DELETE" })

// Presença
export const updatePresenca = (presenca: Presenca) =>
  request<Player>(`/presenca/${presenca}`, { method: "PATCH" })

// Sorteio
export const realizarSorteio = () =>
  request<{ times: Record<string, Player[]>; date: string }>("/sorteio", {
    method: "POST",
  })

export const getSorteio = () => request<SorteioResult>("/sorteio")

// Admin actions
export const resetSorteio = () =>
  request<{ ok: boolean }>("/admin/reset-sorteio", { method: "POST" })

export const resetPresencas = () =>
  request<{ ok: boolean }>("/admin/reset-presencas", { method: "POST" })

// Config
export const getConfig = () => request<AppConfig>("/config")
