import type { GpsPoint } from "../types/walk"
import { WalkMap } from "../components/WalkMap"

type Props = {
  points: GpsPoint[]
  elapsed: number // seconds
  distance: number // km
  onStop: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function formatClock(timestamp: number): string {
  const d = new Date(timestamp)
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  const ss = String(d.getSeconds()).padStart(2, "0")
  return `${hh}:${mm}:${ss}`
}

export function WalkingScreen({ points, elapsed, distance, onStop }: Props) {
  const lastTimestamp = points.length > 0 ? points[points.length - 1].timestamp : null

  return (
    <div className="h-svh bg-gray-950 text-white flex flex-col">
      <div className="flex-1 relative">
        <WalkMap points={points} />
      </div>

      <div className="p-6 space-y-4">
        <div className="flex justify-around text-center">
          <div>
            <div className="text-3xl font-mono font-bold">
              {formatTime(elapsed)}
            </div>
            <div className="text-sm text-gray-400">経過時間</div>
          </div>
          <div>
            <div className="text-3xl font-mono font-bold">
              {distance.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">km</div>
          </div>
          <div>
            <div className="text-3xl font-mono font-bold">
              {points.length}
            </div>
            <div className="text-sm text-gray-400">ポイント</div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 font-mono">
          最終更新: {lastTimestamp ? formatClock(lastTimestamp) : "—"}
        </div>

        <button
          onClick={onStop}
          className="w-full py-4 bg-red-500 rounded-xl text-white font-bold text-lg active:scale-95 transition-transform"
        >
          散歩をおわる
        </button>
      </div>
    </div>
  )
}
