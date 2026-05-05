import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ClipboardPaste, Shield, Trash2, ListPlus } from "lucide-react"
import { toast } from "sonner"
import { parseList } from "@/lib/parseList"
import { adminAddPlayersBatch } from "@/lib/api"
import type { ParsedPlayer } from "@/lib/parseList"

interface Props {
  filtroEspecial: boolean
  onImported: () => void
}

export default function ImportListDialog({ filtroEspecial, onImported }: Props) {
  const [open, setOpen] = useState(false)
  const [texto, setTexto] = useState("")
  const [items, setItems] = useState<ParsedPlayer[]>([])
  const [loading, setLoading] = useState(false)

  // Parse automático ao mudar texto
  useMemo(() => {
    setItems(parseList(texto))
  }, [texto])

  function toggleGoleiro(idx: number) {
    setItems((prev) =>
      prev.map((p, i) =>
        i === idx
          ? {
              ...p,
              posicao: p.posicao === "goleiro" ? "linha" : "goleiro",
              is_especial: p.posicao === "goleiro" ? p.is_especial : false,
            }
          : p
      )
    )
  }

  function toggleEspecial(idx: number) {
    setItems((prev) =>
      prev.map((p, i) =>
        i === idx
          ? p.posicao === "goleiro"
            ? p
            : { ...p, is_especial: !p.is_especial }
          : p
      )
    )
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function reset() {
    setTexto("")
    setItems([])
  }

  async function handleSubmit() {
    if (items.length === 0) return
    setLoading(true)
    try {
      const r = await adminAddPlayersBatch(items)
      const msg = r.skipped.length
        ? `${r.created.length} cadastrado(s), ${r.skipped.length} já existia(m): ${r.skipped.slice(0, 3).join(", ")}${r.skipped.length > 3 ? "..." : ""}`
        : `${r.created.length} jogador(es) cadastrado(s)!`
      toast.success(msg)
      onImported()
      reset()
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao cadastrar")
    } finally {
      setLoading(false)
    }
  }

  const goleiros = items.filter((p) => p.posicao === "goleiro").length
  const especiais = items.filter((p) => p.is_especial).length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-lg shadow-primary/20">
            <ClipboardPaste className="w-4 h-4 mr-2" />
            Importar lista de jogadores
          </Button>
        }
      />
      <DialogContent className="bg-bg-card border-border max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-text flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-primary" />
            Importar lista de jogadores
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {items.length === 0 ? (
            <>
              <p className="text-xs text-text-muted">
                Cole a lista aqui (WhatsApp, Telegram, anotação, etc). Aceita numeração ou não. Use 🧤 (ou "(gol)") pra marcar goleiros.
              </p>
              <Textarea
                placeholder="1. Pedro&#10;2. João 🧤&#10;3. Marcos&#10;..."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                className="bg-bg-elevated border-border text-text placeholder:text-text-muted min-h-[200px] font-mono text-sm"
                autoFocus
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs">
                <div className="flex gap-2">
                  <span className="text-text-secondary">{items.length} jogador(es)</span>
                  {goleiros > 0 && <span className="text-time-amarelo">· {goleiros} goleiro(s)</span>}
                  {especiais > 0 && <span className="text-time-vermelho">· {especiais} gordinho(s)</span>}
                </div>
                <button
                  onClick={reset}
                  className="text-text-muted hover:text-ausente text-xs"
                >
                  Limpar
                </button>
              </div>

              <div className="space-y-1 border border-border rounded-lg overflow-hidden">
                {items.map((p, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 py-2 px-3 ${
                      i < items.length - 1 ? "border-b border-border/50" : ""
                    }`}
                  >
                    <span className="text-xs text-text-muted font-mono w-6">{i + 1}.</span>
                    <span className="flex-1 text-sm">{p.nome}</span>

                    {/* Goleiro toggle */}
                    <button
                      onClick={() => toggleGoleiro(i)}
                      className={`p-1.5 rounded transition-colors ${
                        p.posicao === "goleiro"
                          ? "text-time-amarelo bg-time-amarelo/10"
                          : "text-faint hover:text-time-amarelo/60"
                      }`}
                      title={p.posicao === "goleiro" ? "Remover goleiro" : "Marcar goleiro"}
                    >
                      <Shield className="w-4 h-4" />
                    </button>

                    {/* Gordinho toggle (só se filtro ativo e não goleiro) */}
                    {filtroEspecial && (
                      <button
                        onClick={() => toggleEspecial(i)}
                        disabled={p.posicao === "goleiro"}
                        className={`px-2 h-7 rounded text-[10px] font-bold transition-colors ${
                          p.posicao === "goleiro"
                            ? "text-faint cursor-not-allowed"
                            : p.is_especial
                            ? "text-time-vermelho bg-time-vermelho/15"
                            : "text-faint hover:text-time-vermelho/60"
                        }`}
                        title={p.is_especial ? "Remover gordinho" : "Marcar gordinho"}
                      >
                        GOR
                      </button>
                    )}

                    {/* Badge atual */}
                    {p.posicao === "goleiro" && (
                      <Badge className="bg-time-amarelo/15 text-time-amarelo border-0 text-[9px] px-1.5">
                        GOL
                      </Badge>
                    )}

                    <button
                      onClick={() => removeItem(i)}
                      className="text-faint hover:text-ausente p-1"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <Textarea
                placeholder="Adicionar mais nomes (cola aqui)..."
                value=""
                onChange={(e) => {
                  const novos = parseList(e.target.value)
                  if (novos.length > 0) {
                    const existentes = new Set(items.map((p) => p.nome.toLowerCase()))
                    const filtrados = novos.filter((p) => !existentes.has(p.nome.toLowerCase()))
                    setItems([...items, ...filtrados])
                  }
                }}
                className="bg-bg-elevated border-border text-text placeholder:text-text-muted min-h-[60px] text-sm"
              />
            </>
          )}
        </div>

        <DialogFooter className="flex-row gap-2 sm:flex-row pt-2">
          <Button
            variant="outline"
            onClick={() => {
              reset()
              setOpen(false)
            }}
            className="flex-1 bg-bg-elevated border-border text-text-secondary"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={items.length === 0 || loading}
            className="flex-1 bg-primary"
          >
            {loading ? "Cadastrando..." : `Cadastrar ${items.length || ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
