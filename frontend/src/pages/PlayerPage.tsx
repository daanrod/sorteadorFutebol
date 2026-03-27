import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { getMe, updatePresenca, getSorteio, logout } from "@/lib/api"
import type { Player, SorteioResult } from "@/lib/types"
import { Check, X, LogOut, Circle, Users } from "lucide-react"
import RouletteAnimation from "@/components/RouletteAnimation"

export default function PlayerPage() {
  const [player, setPlayer] = useState<Player | null>(null)
  const [sorteio, setSorteio] = useState<SorteioResult | null>(null)
  const [showRoulette, setShowRoulette] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    try {
      const { player: p } = await getMe()
      setPlayer(p)
      const s = await getSorteio()
      setSorteio(s)
    } catch {
      navigate("/")
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    load()
  }, [load])

  async function handlePresenca(status: "presente" | "ausente") {
    try {
      const updated = await updatePresenca(status)
      setPlayer(updated)
      toast.success(status === "presente" ? "Presença confirmada!" : "Ausência registrada")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro")
    }
  }

  async function handleLogout() {
    await logout()
    navigate("/")
  }

  function handleReveal() {
    if (player?.time) {
      setShowRoulette(true)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Circle className="w-8 h-8 animate-spin text-text-muted" />
      </div>
    )
  }

  if (!player) return null

  const hasSorteio = sorteio?.done
  const playerTime = player.time

  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{player.nome}</h1>
          <p className="text-text-secondary text-sm">
            {player.posicao === "goleiro" ? "Goleiro" : "Linha"}
          </p>
        </div>
        <button onClick={handleLogout} className="text-text-muted hover:text-text-secondary transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Presença */}
      <Card className="bg-bg-card border-border">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Presença</span>
            {player.presenca === "presente" && (
              <Badge className="bg-presente/15 text-presente border-0 gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-presente" />
                Presente
              </Badge>
            )}
            {player.presenca === "ausente" && (
              <Badge className="bg-ausente/15 text-ausente border-0 gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ausente" />
                Ausente
              </Badge>
            )}
            {player.presenca === "pendente" && (
              <Badge className="bg-faint/50 text-text-muted border-0">Pendente</Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handlePresenca("presente")}
              variant={player.presenca === "presente" ? "default" : "outline"}
              className={
                player.presenca === "presente"
                  ? "bg-presente hover:bg-presente/90 text-white h-11"
                  : "border-border text-text-secondary hover:bg-bg-elevated h-11"
              }
            >
              <Check className="w-4 h-4 mr-2" />
              Presente
            </Button>
            <Button
              onClick={() => handlePresenca("ausente")}
              variant={player.presenca === "ausente" ? "default" : "outline"}
              className={
                player.presenca === "ausente"
                  ? "bg-ausente hover:bg-ausente/90 text-white h-11"
                  : "border-border text-text-secondary hover:bg-bg-elevated h-11"
              }
            >
              <X className="w-4 h-4 mr-2" />
              Ausente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sorteio */}
      {hasSorteio && (
        <Card className="bg-bg-card border-border">
          <CardContent className="pt-6 space-y-4">
            <div className="text-center space-y-3">
              <Circle className="w-10 h-10 mx-auto text-text-muted" />
              <div>
                <h2 className="font-semibold">Sorteio Realizado!</h2>
                <p className="text-text-secondary text-sm">{sorteio.date}</p>
              </div>

              {playerTime && !showRoulette && (
                <Button
                  onClick={handleReveal}
                  className="w-full h-12 bg-primary hover:bg-primary/90 font-semibold text-base"
                >
                  Descobrir meu time
                </Button>
              )}

              {!playerTime && (
                <p className="text-text-muted text-sm">
                  Você não participou deste sorteio
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roulette Animation */}
      {showRoulette && playerTime && (
        <RouletteAnimation
          teamName={playerTime}
          onComplete={() => {}}
        />
      )}

      {/* Ver times */}
      {hasSorteio && (
        <Button
          onClick={() => navigate("/times")}
          variant="outline"
          className="w-full border-border text-text-secondary hover:bg-bg-elevated h-11"
        >
          <Users className="w-4 h-4 mr-2" />
          Ver todos os times
        </Button>
      )}
    </div>
  )
}
