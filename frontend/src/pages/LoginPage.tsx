import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { loginPlayer, getMe } from "@/lib/api"
import { Circle, Shield } from "lucide-react"

export default function LoginPage() {
  const [nome, setNome] = useState("")
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getMe()
      .then(() => navigate("/jogador"))
      .catch(() => setLoading(false))
  }, [navigate])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    try {
      await loginPlayer(nome.trim())
      navigate("/jogador")
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
              <Circle className="w-8 h-8 text-time-verde" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sorteador Futebol</h1>
          <p className="text-text-secondary text-sm">
            Entre com seu nome para confirmar presença e ver seu time
          </p>
        </div>

        <Card className="bg-bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Entrar</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-bg-elevated border-border text-text placeholder:text-text-muted h-11"
                autoFocus
              />
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
