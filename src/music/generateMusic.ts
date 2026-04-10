import type { GpsPoint } from "../types/walk"
import { hashToNote } from "./hashToNote"
import { shapeToRhythm } from "./shapeToRhythm"

export type MusicNote = {
  frequency: number
  startTime: number // seconds from beginning
  duration: number // seconds
  velocity: number // 0.0 - 1.0
}

const MAX_DURATION = 120 // max 2 minutes

/**
 * GPSログ全体から音のシーケンスを生成する
 */
export function generateMusic(points: GpsPoint[]): MusicNote[] {
  if (points.length < 2) return []

  const notes: MusicNote[] = []
  let prevNoteIndex: number | null = null
  let consecutiveStops = 0
  let rawTime = 0

  // Calculate total raw time to determine compression ratio
  let totalRawDuration = 0
  for (let i = 1; i < points.length; i++) {
    const speed = points[i].speed
    const prevSpeed = points[i - 1].speed
    const rhythm = shapeToRhythm(speed, prevSpeed, 0)
    totalRawDuration += rhythm.duration || 0.5 // fallback for rests
  }

  const compressionRatio =
    totalRawDuration > MAX_DURATION ? MAX_DURATION / totalRawDuration : 1

  for (let i = 1; i < points.length; i++) {
    const point = points[i]
    const prevPoint = points[i - 1]

    // Layer 1: hash → note
    const noteEvent = hashToNote(point.lat, point.lng, prevNoteIndex)
    prevNoteIndex = noteEvent.noteIndex

    // Layer 2: shape → rhythm
    if (point.speed < 0.5) {
      consecutiveStops++
    } else {
      consecutiveStops = 0
    }

    const rhythm = shapeToRhythm(point.speed, prevPoint.speed, consecutiveStops)

    if (!rhythm.isRest && rhythm.duration > 0) {
      const compressedDuration = rhythm.duration * compressionRatio

      notes.push({
        frequency: noteEvent.frequency,
        startTime: rawTime,
        duration: compressedDuration,
        velocity: rhythm.velocity,
      })
    }

    rawTime += (rhythm.duration || 0.5) * compressionRatio
  }

  return notes
}
