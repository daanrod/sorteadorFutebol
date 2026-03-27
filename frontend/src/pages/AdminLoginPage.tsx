import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { adminLogin } from "@/lib/api"
import { Shield, ArrowLeft } from "lucide-react"

export default function AdminLoginPage() {
  const [senha, setSenha] = useState("")
  const navigate = useNavigate()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    try {
      await adminLogin(senha)
      navigate("/admin/painel")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Senha incorreta")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-bg-card flex items-center justify-center border border-border">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="text-text-secondary text-sm">
            Acesso restrito ao organizador
          </p>
        </div>

        <Card className="bg-bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Senha</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Senha do admin"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="bg-bg-elevated border-border text-text placeholder:text-text-muted h-11"
                autoFocus
              />
              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold"
                disabled={!senha}
              >
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <button
            onClick={() => navigate("/")}
            className="text-text-muted hover:text-text-secondary text-xs inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao login
          </button>
        </div>
      </div>
    </div>
  )
}
