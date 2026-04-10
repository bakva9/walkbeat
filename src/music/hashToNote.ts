// Pentatonic 2 octaves: C4, D4, E4, G4, A4, C5, D5, E5, G5, A5
const NOTES = [262, 294, 330, 392, 440, 523, 587, 659, 784, 880]

function djb2(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33 + str.charCodeAt(i)) >>> 0
  }
  return hash
}

function gridKey(lat: number, lng: number): string {
  const gLat = Math.floor(lat * 10000) / 10000
  const gLng = Math.floor(lng * 10000) / 10000
  return `${gLat},${gLng}`
}

export type NoteEvent = {
  frequency: number
  noteIndex: number
}

/**
 * GPS座標からハッシュベースで音程を決定する（第1層）
 * 前の音からの跳躍が大きい場合はスムージングする
 */
export function hashToNote(
  lat: number,
  lng: number,
  prevIndex: number | null
): NoteEvent {
  const key = gridKey(lat, lng)
  const hash = djb2(key)
  let noteIndex = hash % NOTES.length

  // Smoothing: limit jumps to ±3
  if (prevIndex !== null) {
    const diff = noteIndex - prevIndex
    if (Math.abs(diff) > 3) {
      noteIndex = prevIndex + Math.sign(diff) * 3
      // Clamp to valid range
      noteIndex = Math.max(0, Math.min(NOTES.length - 1, noteIndex))
    }
  }

  return {
    frequency: NOTES[noteIndex],
    noteIndex,
  }
}
