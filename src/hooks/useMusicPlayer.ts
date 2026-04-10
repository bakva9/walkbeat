import { useState, useCallback, useRef, useEffect } from "react"
import type { GpsPoint } from "../types/walk"
import { generateMusic } from "../music/generateMusic"
import type { MusicNote } from "../music/generateMusic"
import { playSequence, stop } from "../music/audioEngine"

export function useMusicPlayer(points: GpsPoint[]) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [notes, setNotes] = useState<MusicNote[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Generate notes from points
  useEffect(() => {
    if (points.length > 1) {
      setNotes(generateMusic(points))
    }
  }, [points])

  const play = useCallback(() => {
    if (notes.length === 0) return

    const duration = playSequence(notes)
    setIsPlaying(true)

    timerRef.current = setTimeout(() => {
      setIsPlaying(false)
    }, duration * 1000)
  }, [notes])

  const pause = useCallback(() => {
    stop()
    setIsPlaying(false)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { isPlaying, toggle, noteCount: notes.length }
}
