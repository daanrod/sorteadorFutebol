import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getSorteio } from "@/lib/api"
import type { SorteioResult, Player } from "@/lib/types"
import { timesOrdenados, teamAccent, teamBadge } from "@/lib/utils-times"
import { ArrowLeft, Circle, Shield } from "lucide-react"


function formatDateBR(date: string | null) {
  if (!date) return ""
  const [y, m, d] = date.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  const dias = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]
  return `${dias[dt.getDay()]} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`
}

export default function TimesPage() {
  const [sorteio, setSorteio] = useState<SorteioResult | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getSorteio()
      .then(setSorteio)
      .catch(() => navigate("/"))
      .finally(() => setLoading(false))
  }, [navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Circle className="w-8 h-8 animate-spin text-text-muted" />
      </div>
    )
  }

  if (!sorteio?.done) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center space-y-4">
          <Circle className="w-12 h-12 mx-auto text-text-muted" />
          <h2 className="text-lg font-semibold">Nenhum sorteio realizado</h2>
          <p className="text-text-secondary text-sm">Aguarde o admin realizar o sorteio</p>
          <Button onClick={() => navigate("/")} variant="outline" className="border-border">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-text-muted hover:text-text-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Times</h1>
        <span className="text-text-muted text-xs">{formatDateBR(sorteio.date)}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {timesOrdenados(sorteio.times).map(([nome, jogadores]) => (
          <Card
            key={nome}
            className={`bg-bg-card border-border border-l-4 ${teamAccent(nome)}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">{nome}</CardTitle>
                <Badge className={`border-0 text-xs ${teamBadge(nome)}`}>
                  {jogadores.length} jogadores
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {jogadores.map((p: Player) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-bg-elevated/50 transition-colors"
                >
                  <span className="text-sm font-medium">{p.nome}</span>
                  <div className="flex items-center gap-2">
                    {p.is_admin && (
                      <Badge className="bg-primary/15 text-primary border-0 text-[10px] px-1.5">
                        ADM
                      </Badge>
                    )}
                    {p.is_especial && (
                      <Badge className="bg-time-vermelho/15 text-time-vermelho border-0 text-[10px] px-1.5">
                        GOR
                      </Badge>
                    )}
                    {p.is_avulso && (
                      <Badge className="bg-text-muted/15 text-text-muted border-0 text-[10px] px-1.5">
                        AVL
                      </Badge>
                    )}
                    {p.posicao === "goleiro" && (
                      <Badge className="bg-faint/50 text-text-muted border-0 text-[10px] px-1.5">
                        <Shield className="w-3 h-3 mr-1" />
                        GOL
                      </Badge>
                    )}
                    {p.top_player && (
                      <Badge className="bg-top/15 text-top border-0 text-[10px] px-1.5">
                        TOP
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {jogadores.length === 0 && (
                <p className="text-text-muted text-sm text-center py-4">
                  Nenhum jogador
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
