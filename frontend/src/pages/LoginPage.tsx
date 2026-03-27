import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { loginPlayer, getMe, getSorteio, getConfig } from "@/lib/api"
import type { Posicao } from "@/lib/types"
import { Circle, Shield, Goal, Check, X } from "lucide-react"

export default function LoginPage() {
  const [nome, setNome] = useState("")
  const [posicao, setPosicao] = useState<Posicao>("linha")
  const [presenca, setPresenca] = useState<"presente" | "ausente">("presente")
  const [especial, setEspecial] = useState(false)
  const [filtroEspecial, setFiltroEspecial] = useState(false)
  const [society, setSociety] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    (async () => {
      // Sempre carregar config pra saber se filtro gordinho tá ativo
      getConfig().then(cfg => {
        setFiltroEspecial(cfg.filtro_especial ?? false)
        setSociety(cfg.society ?? false)
      }).catch(() => {})

      try {
        await getMe()
        const s = await getSorteio()
        navigate(s.done ? "/times" : "/jogador")
      } catch {
        setLoading(false)
      }
    })()
  }, [navigate])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    try {
      await loginPlayer(nome.trim(), posicao, especial)
      // Marcar presença logo após entrar
      await fetch(`/api/presenca/${presenca}`, {
        method: "PATCH",
        credentials: "include",
      })
      const s = await getSorteio()
      navigate(s.done ? "/times" : "/jogador")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao entrar")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Circle className="w-8 h-8 animate-spin text-text-muted" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-bg-card flex items-center justify-center border border-border">
              <Goal className="w-8 h-8 text-time-verde" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sorteador Futebol</h1>
          <Badge className={`border-0 text-[10px] px-2 py-0.5 ${society ? "bg-primary/15 text-primary" : "bg-presente/15 text-presente"}`}>
            {society ? "Society (6 por time)" : "Futsal (5 por time)"}
          </Badge>
          <p className="text-text-secondary text-sm">
            Coloca teu nome, escolhe a posição e confirma presença
          </p>
        </div>

        <Card className="bg-bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Entrar</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                placeholder="Seu nome (único)"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-bg-elevated border-border text-text placeholder:text-text-muted h-11"
                autoFocus
              />

              {/* Presença */}
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Presença</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPresenca("presente")}
                  className={`flex items-center justify-center gap-1.5 h-10 rounded-lg border text-xs font-medium transition-all ${
                    presenca === "presente"
                      ? "bg-presente/15 border-presente text-presente"
                      : "bg-bg-elevated border-border text-text-muted hover:border-faint"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  Presente
                </button>
                <button
                  type="button"
                  onClick={() => setPresenca("ausente")}
                  className={`flex items-center justify-center gap-1.5 h-10 rounded-lg border text-xs font-medium transition-all ${
                    presenca === "ausente"
                      ? "bg-ausente/15 border-ausente text-ausente"
                      : "bg-bg-elevated border-border text-text-muted hover:border-faint"
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  Ausente
                </button>
              </div>

              <div className="border-t border-border" />

              {/* Posição */}
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Goleiro</p>
              <button
                type="button"
                onClick={() => {
                  const novo = posicao === "linha" ? "goleiro" : "linha"
                  setPosicao(novo)
                  if (novo === "goleiro") setEspecial(false)
                }}
                className={`w-full flex items-center justify-center gap-1.5 h-10 rounded-lg border text-xs font-medium transition-all ${
                  posicao === "goleiro"
                    ? "bg-time-amarelo/15 border-time-amarelo text-time-amarelo"
                    : "bg-bg-elevated border-border text-text-muted hover:border-faint"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Goleiro
              </button>

              {filtroEspecial && (
                <>
                  <div className="border-t border-border" />
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Especial</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (posicao === "goleiro") return
                      setEspecial(!especial)
                    }}
                    disabled={posicao === "goleiro"}
                    className={`w-full flex items-center justify-center gap-1.5 h-10 rounded-lg border text-xs font-medium transition-all ${
                      posicao === "goleiro"
                        ? "bg-bg-elevated border-border text-faint cursor-not-allowed"
                        : especial
                          ? "bg-time-vermelho/15 border-time-vermelho text-time-vermelho"
                          : "bg-bg-elevated border-border text-text-muted hover:border-faint"
                    }`}
                  >
                    Gordinho
                  </button>
                </>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold"
                disabled={!nome.trim()}
              >
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <button
            onClick={() => navigate("/admin")}
            className="text-text-muted hover:text-text-secondary text-xs inline-flex items-center gap-1.5 transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            Painel Admin
          </button>
        </div>
      </div>
    </div>
  )
}
