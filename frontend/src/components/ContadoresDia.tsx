import { Shuffle, RotateCcw } from "lucide-react"

interface Props {
  sorteioCount: number
  resetCount: number
}

export default function ContadoresDia({ sorteioCount, resetCount }: Props) {
  if (sorteioCount === 0 && resetCount === 0) return null

  return (
    <div className="flex justify-center">
      <div className="inline-flex items-stretch rounded-lg overflow-hidden border-2 border-border bg-bg-card">
        <div className="flex items-center gap-2 px-4 py-2 bg-presente/10 border-r border-border">
          <Shuffle className="w-4 h-4 text-presente" />
          <div>
            <p className="text-presente font-bold text-base leading-tight">{sorteioCount}</p>
            <p className="text-presente/80 text-[10px] leading-tight uppercase tracking-wider">Sorteios</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-ausente/10">
          <RotateCcw className="w-4 h-4 text-ausente" />
          <div>
            <p className="text-ausente font-bold text-base leading-tight">{resetCount}</p>
            <p className="text-ausente/80 text-[10px] leading-tight uppercase tracking-wider">Resets</p>
          </div>
        </div>
      </div>
    </div>
  )
}
