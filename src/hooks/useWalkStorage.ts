import { useState, useCallback } from "react"
import type { Walk } from "../types/walk"

const STORAGE_KEY = "walkbeat_walks"

function loadWalks(): Walk[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Walk[]
  } catch {
    return []
  }
}

export function useWalkStorage() {
  const [walks, setWalks] = useState<Walk[]>(() => loadWalks())

  const saveWalk = useCallback((walk: Walk) => {
    setWalks((prev) => {
      const next = [walk, ...prev]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { walks, saveWalk }
}
