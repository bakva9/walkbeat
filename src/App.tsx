import { useState, useCallback, useEffect, useRef } from "react"
import type { Screen, Walk, GpsPoint } from "./types/walk"
import { HomeScreen } from "./screens/HomeScreen"
import { WalkingScreen } from "./screens/WalkingScreen"
import { ResultScreen } from "./screens/ResultScreen"
import { useWalkStorage } from "./hooks/useWalkStorage"
import { useGeolocation } from "./hooks/useGeolocation"

function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function calcDistance(points: GpsPoint[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    total += haversine(prev.lat, prev.lng, curr.lat, curr.lng)
  }
  return total
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home")
  const [currentWalk, setCurrentWalk] = useState<Walk | null>(null)
  const [walkStartTime, setWalkStartTime] = useState<number>(0)
  const [elapsed, setElapsed] = useState(0)
  const { walks, saveWalk } = useWalkStorage()
  const { points, reset: resetGps } = useGeolocation(screen === "walking")
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Elapsed time counter
  useEffect(() => {
    if (screen === "walking") {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - walkStartTime) / 1000))
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [screen, walkStartTime])

  const handleStart = useCallback(() => {
    resetGps()
    setWalkStartTime(Date.now())
    setElapsed(0)
    setScreen("walking")
  }, [resetGps])

  const handleStop = useCallback(() => {
    const now = Date.now()
    const walk: Walk = {
      id: `walk_${walkStartTime}`,
      startedAt: new Date(walkStartTime).toISOString(),
      endedAt: new Date(now).toISOString(),
      distance: calcDistance(points),
      duration: Math.floor((now - walkStartTime) / 1000),
      points,
    }
    setCurrentWalk(walk)
    saveWalk(walk)
    setScreen("result")
  }, [walkStartTime, points, saveWalk])

  const handleSelectWalk = useCallback((walk: Walk) => {
    setCurrentWalk(walk)
    setScreen("result")
  }, [])

  const handleHome = useCallback(() => {
    setCurrentWalk(null)
    setScreen("home")
  }, [])

  switch (screen) {
    case "home":
      return (
        <HomeScreen
          walks={walks}
          onStart={handleStart}
          onSelectWalk={handleSelectWalk}
        />
      )
    case "walking":
      return (
        <WalkingScreen
          points={points}
          elapsed={elapsed}
          distance={calcDistance(points)}
          onStop={handleStop}
        />
      )
    case "result":
      return currentWalk ? (
        <ResultScreen walk={currentWalk} onHome={handleHome} />
      ) : (
        <HomeScreen
          walks={walks}
          onStart={handleStart}
          onSelectWalk={handleSelectWalk}
        />
      )
  }
}
