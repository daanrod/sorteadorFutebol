import { useState, useEffect, useRef } from "react"

const TEAMS = ["Amarelo", "Azul", "Verde", "Vermelho"]

const TEAM_BG: Record<string, string> = {
  Amarelo: "bg-time-amarelo",
  Azul: "bg-time-azul",
  Verde: "bg-time-verde",
  Vermelho: "bg-time-vermelho",
}

const TEAM_TEXT: Record<string, string> = {
  Amarelo: "text-gray-900",
  Azul: "text-white",
  Verde: "text-white",
  Vermelho: "text-white",
}

interface Props {
  teamName: string
  onComplete: () => void
}

export default function RouletteAnimation({ teamName, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [spinning, setSpinning] = useState(true)
  const [revealed, setRevealed] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    let speed = 80
    let iterations = 0
    const targetIndex = TEAMS.indexOf(teamName)

    function tick() {
      setCurrentIndex((prev) => (prev + 1) % TEAMS.length)
      iterations++

      // Slow down after 15 iterations
      if (iterations > 15) speed = 150
      if (iterations > 22) speed = 250
      if (iterations > 28) speed = 400

      // Stop at the correct team after enough spins
      if (iterations > 30) {
        setCurrentIndex(targetIndex)
        setSpinning(false)
        setTimeout(() => setRevealed(true), 300)
        setTimeout(onComplete, 1500)
        return
      }

      intervalRef.current = setTimeout(tick, speed)
    }

    intervalRef.current = setTimeout(tick, speed)

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current)
    }
  }, [teamName, onComplete])

  const displayTeam = TEAMS[currentIndex]

  return (
    <div className="space-y-4">
      <div
        className={`
          rounded-xl p-8 text-center transition-all duration-300
          ${spinning ? "scale-95" : "scale-100"}
          ${revealed ? TEAM_BG[displayTeam] : "bg-bg-elevated"}
        `}
      >
        <div
          className={`
            text-4xl font-bold tracking-tight transition-all duration-300
            ${revealed ? TEAM_TEXT[displayTeam] : "text-text"}
            ${spinning ? "opacity-80" : "opacity-100"}
          `}
        >
          {spinning ? (
            <span className="inline-block animate-pulse">{displayTeam}</span>
          ) : (
            <div className="space-y-2">
              <span className="block text-lg font-medium opacity-80">
                Seu time
              </span>
              <span className="block text-5xl">{displayTeam}</span>
            </div>
          )}
        </div>
      </div>

      {/* Indicator dots */}
      <div className="flex justify-center gap-2">
        {TEAMS.map((team, i) => (
          <div
            key={team}
            className={`
              w-3 h-3 rounded-full transition-all duration-200
              ${i === currentIndex ? `${TEAM_BG[team]} scale-125` : "bg-faint"}
            `}
          />
        ))}
      </div>
    </div>
  )
}
