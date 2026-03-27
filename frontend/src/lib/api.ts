import type { Player, Posicao, Presenca, SorteioResult, AppConfig } from "./types"

const BASE = import.meta.env.PROD ? "http://217.216.64.14:8000/api" : "/api"

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

// Auth jogador (autocadastro: nome + posição + especial)
export const loginPlayer = (nome: string, posicao: Posicao, is_especial = false) =>
  request<{ player: Player }>("/login", {
    method: "POST",
    body: JSON.stringify({ nome, posicao, is_especial }),
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

// Presença + Posição (jogador atualiza a própria)
export const updatePresenca = (presenca: Presenca) =>
  request<Player>(`/presenca/${presenca}`, { method: "PATCH" })

export const updatePosicao = (posicao: Posicao) =>
  request<Player>(`/posicao/${posicao}`, { method: "PATCH" })

// Sorteio
export const realizarSorteio = () =>
  request<{ times: Record<string, Player[]>; date: string }>("/sorteio", {
    method: "POST",
  })

export const getSorteio = () => request<SorteioResult>("/sorteio")

// Admin actions
export const adminRegister = (nome: string, posicao: Posicao, is_especial = false) =>
  request<Player>("/admin/register", {
    method: "POST",
    body: JSON.stringify({ nome, posicao, is_especial }),
  })

export const adminMe = () => request<{ player: Player | null }>("/admin/me")

export const adminAddPlayer = (nome: string, posicao: Posicao, is_especial = false) =>
  request<Player>("/admin/add-player", {
    method: "POST",
    body: JSON.stringify({ nome, posicao, is_especial }),
  })

export const toggleFiltroEspecial = () =>
  request<{ filtro_especial: boolean }>("/admin/toggle-filtro-especial", { method: "POST" })

export const toggleSociety = () =>
  request<{ society: boolean }>("/admin/toggle-society", { method: "POST" })

export const resetSorteio = () =>
  request<{ ok: boolean }>("/admin/reset-sorteio", { method: "POST" })

export const resetPresencas = () =>
  request<{ ok: boolean }>("/admin/reset-presencas", { method: "POST" })

export const resetAll = () =>
  request<{ ok: boolean }>("/admin/reset-all", { method: "POST" })

// Config
export const getConfig = () => request<AppConfig>("/config")
