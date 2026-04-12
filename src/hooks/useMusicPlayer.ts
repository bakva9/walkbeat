import { useState, useCallback, useRef, useEffect } from "react"
import type { GpsPoint } from "../types/walk"
import { generateMusic } from "../music/generateMusic"
import type { MusicNote } from "../music/generateMusic"
import { analyzeSections } from "../music/sectionAnalyzer"
import type { SectionInfo } from "../music/sectionAnalyzer"
import { playSequence, stop, getContextTime } from "../music/audioEngine"

export function useMusicPlayer(points: GpsPoint[]) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [notes, setNotes] = useState<MusicNote[]>([])
  const [sections, setSections] = useState<SectionInfo[]>([])
  const [currentPointIndex, setCurrentPointIndex] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)
  const startedAtRef = useRef(0)
  const durationRef = useRef(0)
  const notesRef = useRef<MusicNote[]>([])

  // Generate notes and sections from points
  useEffect(() => {
    if (points.length > 1) {
      const generatedNotes = generateMusic(points)
      setNotes(generatedNotes)

      // Calculate total music duration for section timing
      const totalDuration =
        generatedNotes.length > 0
          ? generatedNotes[generatedNotes.length - 1].startTime +
            generatedNotes[generatedNotes.length - 1].duration +
            0.3
          : 0
      setSections(analyzeSections(points, totalDuration))
    }
  }, [points])

  useEffect(() => {
    notesRef.current = notes
  }, [notes])

  const clearRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    const currentNotes = notesRef.current
    const elapsed = getContextTime() - startedAtRef.current
    const dur = durationRef.current

    if (elapsed < 0) {
      rafRef.current = requestAnimationFrame(tick)
      return
    }

    // Find the most recently started note at or before elapsed time
    let idx = -1
    for (let i = currentNotes.length - 1; i >= 0; i--) {
      if (currentNotes[i].startTime <= elapsed) {
        idx = i
        break
      }
    }

    setCurrentPointIndex(idx >= 0 ? currentNotes[idx].pointIndex : null)
    setProgress(dur > 0 ? Math.min(1, elapsed / dur) : 0)

    if (elapsed < dur) {
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [])

  const play = useCallback(() => {
    if (notes.length === 0) return

    const { duration, startedAt } = playSequence(notes, sections)
    startedAtRef.current = startedAt
    durationRef.current = duration
    setIsPlaying(true)
    setProgress(0)
    setCurrentPointIndex(null)

    clearRaf()
    rafRef.current = requestAnimationFrame(tick)

    timerRef.current = setTimeout(() => {
      setIsPlaying(false)
      setCurrentPointIndex(null)
      setProgress(1)
      clearRaf()
    }, duration * 1000)
  }, [notes, sections, tick, clearRaf])

  const pause = useCallback(() => {
    stop()
    setIsPlaying(false)
    setCurrentPointIndex(null)
    setProgress(0)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    clearRaf()
  }, [clearRaf])

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
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return {
    isPlaying,
    toggle,
    noteCount: notes.length,
    notes,
    sections,
    currentPointIndex,
    progress,
    totalDuration: durationRef.current,
  }
}
