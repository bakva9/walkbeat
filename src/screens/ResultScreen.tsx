import type { Walk } from "../types/walk"
import { RouteMap } from "../components/RouteMap"
import { useMusicPlayer } from "../hooks/useMusicPlayer"

type Props = {
  walk: Walk
  onHome: () => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}分${s > 0 ? `${s}秒` : ""}`
}

export function ResultScreen({ walk, onHome }: Props) {
  const { isPlaying, toggle, noteCount } = useMusicPlayer(walk.points)

  return (
    <div className="min-h-svh bg-gray-950 text-white flex flex-col">
      <div className="h-64">
        <RouteMap points={walk.points} />
      </div>

      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{walk.distance.toFixed(1)}</div>
            <div className="text-sm text-gray-400">km</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {formatDuration(walk.duration)}
            </div>
            <div className="text-sm text-gray-400">時間</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {walk.duration > 0
                ? ((walk.distance / walk.duration) * 3600).toFixed(1)
                : "0"}
            </div>
            <div className="text-sm text-gray-400">km/h</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={toggle}
            disabled={noteCount === 0}
            className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlaying ? (
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <span className="text-sm text-gray-500">
            {noteCount > 0 ? `${noteCount} notes` : "データが足りません"}
          </span>
        </div>

        <button
          onClick={onHome}
          className="w-full py-4 bg-gray-800 rounded-xl text-white font-bold active:scale-95 transition-transform"
        >
          ホームに戻る
        </button>
      </div>
    </div>
  )
}
