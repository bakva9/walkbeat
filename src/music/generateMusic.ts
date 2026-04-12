import type { GpsPoint } from "../types/walk"
import { hashToNote } from "./hashToNote"
import { shapeToRhythm } from "./shapeToRhythm"
import { calculateCurvature, quantizeCurvature } from "./curvature"

export type MusicNote = {
  frequency: number
  noteIndex: number // 0-9 (pentatonic scale position)
  startTime: number // seconds from beginning
  duration: number // seconds
  velocity: number // 0.0 - 1.0
  pointIndex: number // which GPS point this note came from
}

// Pentatonic 2 octaves (same table as hashToNote)
const NOTES = [262, 294, 330, 392, 440, 523, 587, 659, 784, 880]

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
  let lowCurvatureRun = 0 // 低曲率の連続カウント（間引き用）

  // Pass 1: Calculate total raw time to determine compression ratio
  let totalRawDuration = 0
  for (let i = 1; i < points.length; i++) {
    const speed = points[i].speed
    const prevSpeed = points[i - 1].speed
    const rhythm = shapeToRhythm(speed, prevSpeed, 0)
    totalRawDuration += rhythm.duration || 0.5
  }

  const compressionRatio =
    totalRawDuration > MAX_DURATION ? MAX_DURATION / totalRawDuration : 1

  // Pass 2: Generate notes
  for (let i = 1; i < points.length; i++) {
    const point = points[i]
    const prevPoint = points[i - 1]

    // Layer 1: hash → note
    const noteEvent = hashToNote(point.lat, point.lng, prevNoteIndex)
    prevNoteIndex = noteEvent.noteIndex

    // Layer 2a: stop detection
    if (point.speed < 0.5) {
      consecutiveStops++
    } else {
      consecutiveStops = 0
    }

    // Layer 2b: rhythm
    const rhythm = shapeToRhythm(point.speed, prevPoint.speed, consecutiveStops)

    // Layer 2c: curvature → density
    const curvature =
      i < points.length - 1
        ? calculateCurvature(prevPoint, point, points[i + 1])
        : 0
    const curvatureBand = quantizeCurvature(curvature)

    // Track low-curvature runs for thinning
    if (curvatureBand === "low") {
      lowCurvatureRun++
    } else {
      lowCurvatureRun = 0
    }

    if (!rhythm.isRest && rhythm.duration > 0) {
      const compressedDuration = rhythm.duration * compressionRatio

      // Low curvature: thin out (play every other note)
      const shouldThin = curvatureBand === "low" && lowCurvatureRun % 2 === 0

      if (!shouldThin) {
        notes.push({
          frequency: noteEvent.frequency,
          noteIndex: noteEvent.noteIndex,
          startTime: rawTime,
          duration: compressedDuration,
          velocity: rhythm.velocity,
          pointIndex: i,
        })

        // High curvature: insert passing tone between current and next
        if (curvatureBand === "high" && i + 1 < points.length) {
          const nextNoteEvent = hashToNote(
            points[i + 1].lat,
            points[i + 1].lng,
            noteEvent.noteIndex
          )
          const diff = nextNoteEvent.noteIndex - noteEvent.noteIndex
          if (Math.abs(diff) > 1) {
            const midIndex = Math.floor(
              (noteEvent.noteIndex + nextNoteEvent.noteIndex) / 2
            )
            const clampedIndex = Math.max(
              0,
              Math.min(NOTES.length - 1, midIndex)
            )
            notes.push({
              frequency: NOTES[clampedIndex],
              noteIndex: clampedIndex,
              startTime: rawTime + compressedDuration * 0.5,
              duration: compressedDuration * 0.5,
              velocity: rhythm.velocity * 0.8,
              pointIndex: i,
            })
          }
        }
      }
    }

    rawTime += (rhythm.duration || 0.5) * compressionRatio
  }

  return notes
}
