import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getMe, getPlayers, getSorteio, getConfig } from "@/lib/api"
import type { Player, SorteioResult } from "@/lib/types"
import { timesOrdenados, teamAccent, teamBadge } from "@/lib/utils-times"
import { Circle, Shield, Check, X, Timer } from "lucide-react"
import { useRealtimeUpdate } from "@/lib/useRealtimeUpdate"


function formatDateBR(date: string | null) {
  if (!date) return ""
  const [y, m, d] = date.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  const dias = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]
  return `${dias[dt.getDay()]} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`
}

function PlayerBadges({ p }: { p: Player }) {
  return (
    <div className="flex gap-1">
      {p.posicao === "goleiro" && (
        <Badge className="bg-faint/50 text-text-muted border-0 text-[9px] px-1.5 py-0.5">
          <Shield className="w-3 h-3 mr-0.5" />GOL
        </Badge>
      )}
      {p.top_player && (
        <Badge className="bg-top/15 text-top border-0 text-[9px] px-1.5 py-0.5">TOP</Badge>
      )}
      {p.is_admin && (
        <Badge className="bg-primary/15 text-primary border-0 text-[9px] px-1.5 py-0.5">ADM</Badge>
      )}
      {p.is_especial && (
        <Badge className="bg-time-vermelho/15 text-time-vermelho border-0 text-[9px] px-1.5 py-0.5">GOR</Badge>
      )}
      {p.is_avulso && (
        <Badge className="bg-text-muted/15 text-text-muted border-0 text-[9px] px-1.5 py-0.5">AVL</Badge>
      )}
    </div>
  )
}

export default function PlayerPage() {
  const [me, setMe] = useState<Player | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [sorteio, setSorteio] = useState<SorteioResult | null>(null)
  const [society, setSociety] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    try {
      const [{ player }, allPlayers, s] = await Promise.all([
        getMe(), getPlayers(), getSorteio(),
      ])
      setMe(player)
      setPlayers(allPlayers)
      setSorteio(s)
      getConfig().then(cfg => setSociety(cfg.society ?? false)).catch(() => {})
    } catch {
      navigate("/")
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => { load() }, [load])
  useRealtimeUpdate(load)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Circle className="w-8 h-8 animate-spin text-text-muted" />
      </div>
    )
  }

  if (!me) return null

  const hasSorteio = sorteio?.done
  const sort = (list: Player[]) => [...list].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
  const presentes = sort(players.filter(p => p.presenca === "presente"))
  const ausentes = sort(players.filter(p => p.presenca === "ausente"))

  const isMe = (p: Player) => p.id === me.id
  const meRow = (p: Player) =>
    isMe(p) ? "bg-time-amarelo/10 text-time-amarelo font-semibold" : ""

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold">{me.nome}</h1>
          <Badge className={`border-0 text-[9px] px-1.5 py-0 ${
            me.presenca === "presente" ? "bg-presente/15 text-presente" : "bg-ausente/15 text-ausente"
          }`}>
            {me.presenca === "presente" ? "Presente" : "Ausente"}
          </Badge>
          {me.posicao === "goleiro" && (
            <Badge className="bg-faint/50 text-text-muted border-0 text-[9px] px-1.5 py-0">GOL</Badge>
          )}
        </div>
      </div>

      {/* Se sorteio aconteceu → mostrar times */}
      {hasSorteio ? (
        <>
          <div className="text-center py-3">
            <h2 className="text-xl font-bold">Times Sorteados!</h2>
            <p className="text-text-muted text-sm">{formatDateBR(sorteio.date)}</p>
            {(sorteio.reset_count ?? 0) > 0 && (
              <p className="text-ausente text-xs mt-0.5">Sorteio resetado {sorteio.reset_count}x</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {timesOrdenados(sorteio.times).map(([nome, jogadores]) => (
              <Card
                key={nome}
                className={`bg-bg-card border-border border-l-4 ${teamAccent(nome)}`}
              >
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
                        <tr
                          key={p.id}
                          className={`${meRow(p)} ${i < jogadores.length - 1 ? "border-b border-border/50" : ""}`}
                        >
                          <td className="py-2 px-4 text-sm">{p.nome}</td>
                          <td className="py-2 px-4 text-right"><PlayerBadges p={p} /></td>
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
          {/* Aguardando sorteio */}
          <div className="flex items-center justify-between bg-bg-card rounded-lg px-4 py-3 border border-border">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-text-muted animate-pulse" />
              <span className="text-sm text-text-secondary">Aguardando sorteio · {society ? "Society" : "Futsal"}</span>
            </div>
            <div className="flex gap-3 text-xs font-mono">
              <span className="text-presente">{presentes.length} presentes</span>
              <span className="text-ausente">{ausentes.length} ausentes</span>
            </div>
          </div>

          {/* Tabela de Presentes */}
          {presentes.length > 0 && (
            <Card className="bg-bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Check className="w-4 h-4 text-presente" />
                    Presentes
                  </CardTitle>
                  <span className="text-xs text-presente font-mono">{presentes.length}</span>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-2">
                <table className="w-full">
                  <tbody>
                    {presentes.map((p, i) => (
                      <tr
                        key={p.id}
                        className={`${meRow(p)} ${i < presentes.length - 1 ? "border-b border-border/50" : ""}`}
                      >
                        <td className="py-2 px-4 text-sm">{p.nome}</td>
                        <td className="py-2 px-4 text-right"><PlayerBadges p={p} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Tabela de Ausentes */}
          {ausentes.length > 0 && (
            <Card className="bg-bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <X className="w-4 h-4 text-ausente" />
                    Ausentes
                  </CardTitle>
                  <span className="text-xs text-ausente font-mono">{ausentes.length}</span>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-2">
                <table className="w-full">
                  <tbody>
                    {ausentes.map((p, i) => (
                      <tr
                        key={p.id}
                        className={`text-text-muted ${i < ausentes.length - 1 ? "border-b border-border/50" : ""}`}
                      >
                        <td className="py-2 px-4 text-sm">{p.nome}</td>
                        <td className="py-2 px-4 text-right"><PlayerBadges p={p} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <p className="text-center text-text-muted text-[10px] pb-4">
        Atualiza em tempo real
      </p>
    </div>
  )
}
