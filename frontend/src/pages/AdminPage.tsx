import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import ConfirmDialog from "@/components/ConfirmDialog"
import {
  getPlayers, updatePlayer, deletePlayer, adminRegister, adminMe, adminAddPlayer,
  realizarSorteio, resetAll, resetSorteio, getSorteio, getConfig, toggleFiltroEspecial, toggleSociety,
} from "@/lib/api"
import type { Player, Posicao } from "@/lib/types"
import { timesOrdenados, teamAccent, teamBadge } from "@/lib/utils-times"
import {
  Trash2, Circle, Shuffle, RotateCcw, Users, Check, X,
  Shield, Star, UserPlus, Cookie,
} from "lucide-react"
import { useRealtimeUpdate } from "@/lib/useRealtimeUpdate"

function formatDateBR(date: string | null) {
  if (!date) return ""
  const [y, m, d] = date.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  const dias = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]
  return `${dias[dt.getDay()]} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`
}

export default function AdminPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [sorteioFeito, setSorteioFeito] = useState(false)
  const [sorteioData, setSorteioData] = useState<{times: Record<string, Player[]>, reservas?: Player[], date: string | null, reset_count?: number} | null>(null)
  const [adminPlayer, setAdminPlayer] = useState<Player | null>(null)
  const [filtroEspecial, setFiltroEspecial] = useState(false)
  const [society, setSociety] = useState(false)
  const [cadastroTipo, setCadastroTipo] = useState<"eu" | "avulso">("eu")
  const [cadastroNome, setCadastroNome] = useState("")
  const [cadastroPosicao, setCadastroPosicao] = useState<Posicao>("linha")
  const [cadastroEspecial, setCadastroEspecial] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    try {
      const [p, { player: ap }, s, cfg] = await Promise.all([getPlayers(), adminMe(), getSorteio(), getConfig()])
      setPlayers(p)
      setAdminPlayer(ap)
      setSorteioFeito(s.done)
      setFiltroEspecial(cfg.filtro_especial ?? false)
      setSociety(cfg.society ?? false)
      if (s.done) setSorteioData(s)
    } catch {
      navigate("/admin")
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => { load() }, [load])
  useRealtimeUpdate(load)

  async function handleToggleSociety() {
    try {
      const { society: s } = await toggleSociety()
      setSociety(s)
      toast.success(s ? "Modo Society (6 por time)" : "Modo Futsal (5 por time)")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro")
    }
  }

  async function handleToggleFiltro() {
    try {
      const { filtro_especial } = await toggleFiltroEspecial()
      setFiltroEspecial(filtro_especial)
      toast.success(filtro_especial ? "Filtro especial ativado!" : "Filtro especial desativado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro")
    }
  }

  async function handleAdminRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!cadastroNome.trim()) return
    try {
      await adminRegister(cadastroNome.trim(), cadastroPosicao, cadastroEspecial)
      setCadastroNome("")
      setCadastroPosicao("linha")
      setCadastroEspecial(false)
      load()
      toast.success("Cadastrado com sucesso!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro")
    }
  }

  async function handleAddAvulso(e: React.FormEvent) {
    e.preventDefault()
    if (!cadastroNome.trim()) return
    try {
      await adminAddPlayer(cadastroNome.trim(), cadastroPosicao, cadastroEspecial)
      setCadastroNome("")
      setCadastroPosicao("linha")
      setCadastroEspecial(false)
      load()
      toast.success("Jogador avulso cadastrado!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro")
    }
  }

  async function handleResetSorteio() {
    try {
      await resetSorteio()
      load()
      toast.success("Sorteio resetado!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro")
    }
  }

  async function handleResetAll() {
    try {
      await resetAll()
      load()
      toast.success("Tudo resetado!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro")
    }
  }

  async function handleToggleEspecial(id: string, current: boolean) {
    try {
      await updatePlayer(id, { is_especial: !current } as Partial<Player>)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro")
    }
  }

  async function handleTogglePosicao(id: string, current: string) {
    try {
      await updatePlayer(id, { posicao: current === "goleiro" ? "linha" : "goleiro" } as Partial<Player>)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro")
    }
  }

  async function handleDelete(id: string) {
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
    try {
      await realizarSorteio()
      load()
      toast.success("Sorteio realizado!")
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

  const sorted = [...players].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
  const presentes = sorted.filter(p => p.presenca === "presente")
  const ausentes = sorted.filter(p => p.presenca === "ausente")
  const goleiros = sorted.filter(p => p.posicao === "goleiro")
  const tops = sorted.filter(p => p.top_player)

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

      {sorteioFeito && sorteioData ? (
        <>
          {/* Botões em cima */}
          <div className="flex gap-3">
            <ConfirmDialog
              trigger={
                <Button variant="outline" className="flex-1 h-11 border-primary/30 text-primary hover:bg-primary/10">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Resetar Sorteio
                </Button>
              }
              title="Resetar o sorteio?"
              description="Os times serão desfeitos. Jogadores e presenças continuam."
              confirmText="Resetar Sorteio"
              variant="destructive"
              onConfirm={handleResetSorteio}
            />
            <ConfirmDialog
              trigger={
                <Button variant="outline" className="flex-1 h-11 border-ausente/30 text-ausente hover:bg-ausente/10">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Resetar Tudo
                </Button>
              }
              title="Resetar tudo?"
              description="Todos os cadastros e o sorteio serão apagados."
              confirmText="Resetar"
              variant="destructive"
              onConfirm={handleResetAll}
            />
          </div>

          {/* Info */}
          <div className="text-center py-2">
            <h2 className="text-xl font-bold">Times Sorteados!</h2>
            <p className="text-text-muted text-sm">{formatDateBR(sorteioData.date)}</p>
            {(sorteioData.reset_count ?? 0) > 0 && (
              <p className="text-text-muted text-xs mt-1">Sorteio resetado {sorteioData.reset_count}x</p>
            )}
          </div>

          {/* Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {timesOrdenados(sorteioData.times).map(([nome, jogadores]) => (
                <Card key={nome} className={`bg-bg-card border-border border-l-4 ${teamAccent(nome)}`}>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">{nome}</CardTitle>
                      <Badge className={`border-0 text-[10px] ${teamBadge(nome)}`}>
                        {jogadores.length}/{society ? 6 : 5}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-0 pb-2">
                    <table className="w-full">
                      <tbody>
                        {jogadores.map((p: Player, i: number) => (
                          <tr key={p.id} className={`${i < jogadores.length - 1 ? "border-b border-border/50" : ""} ${
                            adminPlayer && p.id === adminPlayer.id ? "bg-time-amarelo/10 text-time-amarelo font-semibold" : ""
                          }`}>
                            <td className="py-2 px-4 text-sm">{p.nome}</td>
                            <td className="py-2 px-4 text-right">
                              <div className="flex gap-1 justify-end">
                                {p.posicao === "goleiro" && <Badge className="bg-faint/50 text-text-muted border-0 text-[9px] px-1.5 py-0.5"><Shield className="w-3 h-3 mr-0.5" />GOL</Badge>}
                                {p.top_player && <Badge className="bg-top/15 text-top border-0 text-[9px] px-1.5 py-0.5">TOP</Badge>}
                                {p.is_admin && <Badge className="bg-primary/15 text-primary border-0 text-[9px] px-1.5 py-0.5">ADM</Badge>}
                                {p.is_especial && <Badge className="bg-time-vermelho/15 text-time-vermelho border-0 text-[9px] px-1.5 py-0.5">GOR</Badge>}
                                {p.is_avulso && <Badge className="bg-text-muted/15 text-text-muted border-0 text-[9px] px-1.5 py-0.5">AVL</Badge>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
            ))}
          </div>

        </>
      ) : (
        <>
          {/* NÃO SORTEADO — stats, ações, cadastro, listas */}

          {/* Stats */}
          <div className="flex gap-4 justify-center text-center text-xs">
            {[
              { label: "Total", value: players.length, color: "text-text" },
              { label: "Presentes", value: presentes.length, color: "text-presente" },
              { label: "Ausentes", value: ausentes.length, color: "text-ausente" },
              { label: "Goleiros", value: goleiros.length, color: "text-time-amarelo" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
                <p className="text-text-muted text-[10px]">{label}</p>
              </div>
            ))}
          </div>

          {/* Ações */}
          <div className="flex gap-2">
            <ConfirmDialog
              trigger={
                <Button className="flex-1 h-11 bg-presente hover:bg-presente/90 font-semibold" disabled={presentes.length < 4}>
                  <Shuffle className="w-4 h-4 mr-1" />
                  Sortear ({presentes.length})
                </Button>
              }
              title="Realizar o sorteio?"
              description={`${presentes.length} jogadores presentes serão divididos em times de ${society ? "6" : "5"}.`}
              confirmText="Sortear"
              onConfirm={handleSortear}
            />
            <ConfirmDialog
              trigger={
                <Button variant="outline" className="flex-1 h-11 border-ausente/30 text-ausente hover:bg-ausente/10">
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Resetar
                </Button>
              }
              title="Resetar tudo?"
              description="Todos os cadastros e o sorteio serão apagados."
              confirmText="Resetar"
              variant="destructive"
              onConfirm={handleResetAll}
            />
            <ConfirmDialog
              trigger={
                <Button
                  variant="outline"
                  className={`flex-1 h-11 ${
                    filtroEspecial
                      ? "border-presente text-presente bg-presente/10"
                      : "border-ausente text-ausente bg-ausente/10"
                  }`}
                >
                  Gordinhos {filtroEspecial ? "ON" : "OFF"}
                </Button>
              }
              title={filtroEspecial ? "Desativar filtro de gordinhos?" : "Ativar filtro de gordinhos?"}
              description={filtroEspecial
                ? "O botão Gordinho vai sumir do cadastro e o sorteio não vai separar mais."
                : "O botão Gordinho vai aparecer no cadastro e o sorteio vai distribuir máximo 1 gordinho por time."
              }
              confirmText={filtroEspecial ? "Desativar" : "Ativar"}
              variant={filtroEspecial ? "destructive" : "default"}
              onConfirm={handleToggleFiltro}
            />
          </div>

          {/* Modo de jogo */}
          <div className="flex gap-2">
            <button
              onClick={() => { if (society) handleToggleSociety() }}
              className={`flex-1 h-9 rounded-lg border text-xs font-medium transition-all ${
                !society
                  ? "border-cyan-400 text-cyan-400 bg-cyan-400/10"
                  : "border-border text-text-muted hover:border-faint"
              }`}
            >
              Futsal (5 por time)
            </button>
            <button
              onClick={() => { if (!society) handleToggleSociety() }}
              className={`flex-1 h-9 rounded-lg border text-xs font-medium transition-all ${
                society
                  ? "border-cyan-400 text-cyan-400 bg-cyan-400/10"
                  : "border-border text-text-muted hover:border-faint"
              }`}
            >
              Society (6 por time)
            </button>
          </div>

          {/* Cadastrar jogador */}
          <Card className="bg-bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Cadastrar jogador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={cadastroTipo === "eu" ? handleAdminRegister : handleAddAvulso} className="space-y-2">
                <Input
                  placeholder="Nome do jogador"
                  value={cadastroNome}
                  onChange={(e) => setCadastroNome(e.target.value)}
                  className="bg-bg-elevated border-border text-text placeholder:text-text-muted h-10"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCadastroPosicao(cadastroPosicao === "linha" ? "goleiro" : "linha")}
                    className={`flex-1 h-10 rounded-lg border text-xs font-medium transition-all ${
                      cadastroPosicao === "goleiro"
                        ? "bg-time-amarelo/15 border-time-amarelo text-time-amarelo"
                        : "bg-bg-elevated border-border text-text-muted"
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 inline mr-1" />
                    Goleiro
                  </button>
                  {filtroEspecial && (
                    <button
                      type="button"
                      onClick={() => setCadastroEspecial(!cadastroEspecial)}
                      className={`flex-1 h-10 rounded-lg border text-xs font-medium transition-all ${
                        cadastroEspecial
                          ? "bg-time-vermelho/15 border-time-vermelho text-time-vermelho"
                          : "bg-bg-elevated border-border text-text-muted"
                      }`}
                    >
                      Gordinho
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setCadastroTipo(cadastroTipo === "eu" ? "avulso" : "eu")}
                    className={`flex-1 h-10 rounded-lg border text-xs font-medium transition-all ${
                      cadastroTipo === "avulso"
                        ? "bg-ausente/15 border-ausente text-ausente"
                        : "bg-bg-elevated border-border text-text-muted"
                    }`}
                  >
                    Avulso
                  </button>
                  <Button type="submit" className="flex-1 h-10 bg-primary" disabled={!cadastroNome.trim()}>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Cadastrar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Presentes */}
          <Card className="bg-bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Check className="w-4 h-4 text-presente" />
                  Presentes ({presentes.length})
                </CardTitle>
                <div className="flex gap-2 text-xs text-text-muted">
                  <span>{goleiros.length} goleiros</span>
                  <span>{tops.length} tops</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {presentes.length === 0 && (
                <p className="text-text-muted text-sm text-center py-8">
                  Nenhum jogador presente ainda.
                </p>
              )}
              {presentes.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-bg-elevated/50 transition-colors group ${
                    adminPlayer && p.id === adminPlayer.id ? "bg-time-amarelo/10" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-sm font-medium truncate ${
                      adminPlayer && p.id === adminPlayer.id ? "text-time-amarelo" : ""
                    }`}>{p.nome}</span>
                    <div className="flex gap-1.5">
                      {p.posicao === "goleiro" && <Badge className="bg-faint/50 text-text-muted border-0 text-[10px] px-1.5 py-0"><Shield className="w-3 h-3 mr-0.5" />GOL</Badge>}
                      {p.top_player && <Badge className="bg-top/15 text-top border-0 text-[10px] px-1.5 py-0"><Star className="w-3 h-3 mr-0.5" />TOP</Badge>}
                      {p.is_admin && <Badge className="bg-primary/15 text-primary border-0 text-[10px] px-1.5 py-0">ADM</Badge>}
                      {p.is_especial && <Badge className="bg-time-vermelho/15 text-time-vermelho border-0 text-[10px] px-1.5 py-0">GOR</Badge>}
                      {p.is_avulso && <Badge className="bg-text-muted/15 text-text-muted border-0 text-[10px] px-1.5 py-0">AVL</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleTogglePosicao(p.id, p.posicao)} className={`p-1 rounded transition-colors ${p.posicao === "goleiro" ? "text-time-amarelo" : "text-faint hover:text-time-amarelo/60"}`} title={p.posicao === "goleiro" ? "Mudar para linha" : "Mudar para goleiro"}>
                      <Shield className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleToggleTop(p.id, p.top_player)} className={`p-1 rounded transition-colors ${p.top_player ? "text-top" : "text-faint hover:text-top/60"}`} title={p.top_player ? "Remover top player" : "Marcar como cabeça de time"}>
                      <Star className="w-4 h-4" />
                    </button>
                    {filtroEspecial && (
                      <button onClick={() => handleToggleEspecial(p.id, p.is_especial)} className={`p-1 rounded transition-colors ${p.is_especial ? "text-time-vermelho" : "text-faint hover:text-time-vermelho/60"}`} title={p.is_especial ? "Remover gordinho" : "Marcar como gordinho"}>
                        <Cookie className="w-4 h-4" />
                      </button>
                    )}
                    <ConfirmDialog
                      trigger={<button className="p-1 rounded text-faint hover:text-ausente transition-colors opacity-60 hover:opacity-100" title="Remover jogador"><Trash2 className="w-4 h-4" /></button>}
                      title={`Remover ${p.nome}?`}
                      description="O jogador será removido da lista."
                      confirmText="Remover"
                      variant="destructive"
                      onConfirm={() => handleDelete(p.id)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Ausentes */}
          {ausentes.length > 0 && (
            <Card className="bg-bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <X className="w-4 h-4 text-ausente" />
                  Ausentes ({ausentes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {ausentes.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg text-text-muted">
                    <span className="text-sm">{p.nome}</span>
                    <ConfirmDialog
                      trigger={<button className="p-1 rounded text-faint hover:text-ausente transition-colors"><Trash2 className="w-4 h-4" /></button>}
                      title={`Remover ${p.nome}?`}
                      description="O jogador será removido da lista."
                      confirmText="Remover"
                      variant="destructive"
                      onConfirm={() => handleDelete(p.id)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

    </div>
  )
}
