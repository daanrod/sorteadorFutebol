import { Shuffle, RotateCcw } from "lucide-react"

interface Props {
  sorteioCount: number
  resetCount: number
}

export default function ContadoresDia({ sorteioCount, resetCount }: Props) {
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-stretch rounded-lg overflow-hidden border-2 border-border bg-bg-card shadow-md">
        <div className="flex items-center gap-2 px-5 py-2.5 bg-presente/10 border-r-2 border-border">
          <Shuffle className="w-5 h-5 text-presente" />
          <div>
            <p className="text-presente font-bold text-xl leading-tight">{sorteioCount}</p>
            <p className="text-presente/80 text-[10px] leading-tight uppercase tracking-wider font-semibold">Sorteios</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-5 py-2.5 bg-ausente/10">
          <RotateCcw className="w-5 h-5 text-ausente" />
          <div>
            <p className="text-ausente font-bold text-xl leading-tight">{resetCount}</p>
            <p className="text-ausente/80 text-[10px] leading-tight uppercase tracking-wider font-semibold">Resets</p>
          </div>
        </div>
      </div>
    </div>
  )
}
