import type { Walk } from "../types/walk"

type Props = {
  walks: Walk[]
  onStart: () => void
  onSelectWalk: (walk: Walk) => void
}

export function HomeScreen({ walks, onStart, onSelectWalk }: Props) {
  return (
    <div className="min-h-svh bg-gray-950 text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center gap-8 p-6">
        <h1 className="text-4xl font-bold tracking-tight">WalkBeat</h1>
        <p className="text-gray-400 text-center">散歩が音楽になる</p>
        <button
          onClick={onStart}
          className="w-40 h-40 rounded-full bg-emerald-500 text-white text-xl font-bold shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
        >
          散歩をはじめる
        </button>
      </div>

      {walks.length > 0 && (
        <div className="p-6 border-t border-gray-800">
          <h2 className="text-sm text-gray-400 mb-3">過去の散歩</h2>
          <ul className="space-y-2">
            {walks.map((walk) => (
              <li key={walk.id}>
                <button
                  onClick={() => onSelectWalk(walk)}
                  className="w-full text-left px-4 py-3 bg-gray-900 rounded-lg active:bg-gray-800 transition-colors"
                >
                  <span className="text-white">
                    {new Date(walk.startedAt).toLocaleDateString("ja-JP", {
                      month: "short",
                      day: "numeric",
                      weekday: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-gray-400 ml-3">
                    {walk.distance.toFixed(1)} km
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
