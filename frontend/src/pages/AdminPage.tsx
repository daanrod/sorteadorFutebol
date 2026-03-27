import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  getPlayers, createPlayer, updatePlayer, deletePlayer,
  realizarSorteio, resetSorteio, resetPresencas, getSorteio,
} from "@/lib/api"
import type { Player, Posicao, SorteioResult } from "@/lib/types"
import {
  Plus, Trash2, Circle, Shuffle, RotateCcw, Users,
  Shield, Star, CircleDot,
} from "lucide-react"

export default function AdminPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [sorteio, setSorteio] = useState<SorteioResult | null>(null)
  const [novoNome, setNovoNome] = useState("")
  const [novaPosicao, setNovaPosicao] = useState<Posicao>("linha")
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([getPlayers(), getSorteio()])
      setPlayers(p)
      setSorteio(s)
    } catch {
      navigate("/admin")
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => { load() }, [load])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!novoNome.trim()) return
    try {
      await createPlayer(novoNome.trim(), novaPosicao)
      setNovoNome("")
      setNovaPosicao("linha")
      load()
      toast.success("Jogador cadastrado!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro")
    }
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Remover ${nome}?`)) return
    try {
      await deletePlayer(id)
      load()
      toast.success("Jogador removido")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro")
    }
  }

  async function handleToggleTop(id: string, current: boolean) {
    try {
      await updatePlayer(id, { top_player: !current })
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro")
    }
  }

  async function handleSortear() {
    if (!confirm("Realizar o sorteio agora?")) return
    try {
      await realizarSorteio()
      load()
      toast.success("Sorteio realizado!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro")
    }
  }

  async function handleResetSorteio() {
    if (!confirm("Limpar o sorteio? Os times serão apagados.")) return
    try {
      await resetSorteio()
      load()
      toast.success("Sorteio resetado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro")
    }
  }

  async function handleResetPresencas() {
    if (!confirm("Resetar presenças e sorteio? Use para uma nova semana.")) return
    try {
      await resetPresencas()
      load()
      toast.success("Presenças resetadas — pronto pra nova semana!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Circle className="w-8 h-8 animate-spin text-text-muted" />
      </div>
    )
  }

  const presentes = players.filter(p => p.presenca === "presente")
  const ausentes = players.filter(p => p.presenca === "ausente")
  const pendentes = players.filter(p => p.presenca === "pendente")
  const goleiros = players.filter(p => p.posicao === "goleiro")
  const tops = players.filter(p => p.top_player)

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Painel Admin
          </h1>
        </div>
        <Button
          onClick={() => navigate("/times")}
          variant="outline"
          size="sm"
          className="border-border text-text-secondary"
        >
          <Users className="w-4 h-4 mr-1.5" />
          Times
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: players.length, color: "text-text" },
          { label: "Presentes", value: presentes.length, color: "text-presente" },
          { label: "Ausentes", value: ausentes.length, color: "text-ausente" },
          { label: "Pendentes", value: pendentes.length, color: "text-text-muted" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="bg-bg-card border-border">
            <CardContent className="pt-4 pb-4 text-center">
              <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
              <p className="text-text-muted text-[11px] mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Player */}
      <Card className="bg-bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cadastrar Jogador</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="flex gap-3">
              <Input
                placeholder="Nome do jogador"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="bg-bg-elevated border-border text-text placeholder:text-text-muted h-10 flex-1"
              />
              <div className="flex items-center gap-2 bg-bg-elevated rounded-md px-3 border border-border">
                <Label htmlFor="posicao-toggle" className="text-xs text-text-secondary whitespace-nowrap">
                  {novaPosicao === "goleiro" ? "Goleiro" : "Linha"}
                </Label>
                <Switch
                  id="posicao-toggle"
                  checked={novaPosicao === "goleiro"}
                  onCheckedChange={(v) => setNovaPosicao(v ? "goleiro" : "linha")}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-10 bg-primary hover:bg-primary/90 font-medium"
              disabled={!novoNome.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Player List */}
      <Card className="bg-bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Jogadores ({players.length})</CardTitle>
            <div className="flex gap-2 text-xs text-text-muted">
              <span>{goleiros.length} goleiros</span>
              <span>{tops.length} top players</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {players.length === 0 && (
            <p className="text-text-muted text-sm text-center py-8">
              Nenhum jogador cadastrado
            </p>
          )}
          {players.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-bg-elevated/50 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-medium truncate">{p.nome}</span>
                <div className="flex gap-1.5">
                  {p.posicao === "goleiro" && (
                    <Badge className="bg-faint/50 text-text-muted border-0 text-[10px] px-1.5 py-0">
                      <Shield className="w-3 h-3 mr-0.5" />
                      GOL
                    </Badge>
                  )}
                  {p.top_player && (
                    <Badge className="bg-time-amarelo/15 text-time-amarelo border-0 text-[10px] px-1.5 py-0">
                      <Star className="w-3 h-3 mr-0.5" />
                      TOP
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Presença indicator */}
                <CircleDot
                  className={`w-4 h-4 ${
                    p.presenca === "presente" ? "text-presente" :
                    p.presenca === "ausente" ? "text-ausente" :
                    "text-text-muted"
                  }`}
                />

                {/* Top player toggle */}
                <button
                  onClick={() => handleToggleTop(p.id, p.top_player)}
                  className={`p-1 rounded transition-colors ${
                    p.top_player
                      ? "text-time-amarelo"
                      : "text-faint hover:text-text-muted"
                  }`}
                  title={p.top_player ? "Remover top player" : "Marcar top player"}
                >
                  <Star className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(p.id, p.nome)}
                  className="p-1 rounded text-faint hover:text-ausente transition-colors opacity-0 group-hover:opacity-100"
                  title="Remover jogador"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="bg-bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleSortear}
            className="w-full h-11 bg-presente hover:bg-presente/90 font-semibold"
            disabled={presentes.length < 4}
          >
            <Shuffle className="w-4 h-4 mr-2" />
            Sortear Times ({presentes.length} presentes)
          </Button>

          {sorteio?.done && (
            <Button
              onClick={handleResetSorteio}
              variant="outline"
              className="w-full h-11 border-border text-text-secondary hover:bg-bg-elevated"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpar Sorteio
            </Button>
          )}

          <Separator className="bg-border" />

          <Button
            onClick={handleResetPresencas}
            variant="outline"
            className="w-full h-11 border-ausente/30 text-ausente hover:bg-ausente/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Resetar Presenças (nova semana)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
