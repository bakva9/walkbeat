import type { MusicNote } from "./generateMusic"
import type { SectionInfo } from "./sectionAnalyzer"
import { tension } from "./tensionCurve"

let audioContext: AudioContext | null = null
let delayNode: DelayNode | null = null
let feedbackGain: GainNode | null = null
let masterGain: GainNode | null = null
let scheduledSources: OscillatorNode[] = []
let accompanimentSources: OscillatorNode[] = []

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()

    // Master gain
    masterGain = audioContext.createGain()
    masterGain.gain.value = 0.5
    masterGain.connect(audioContext.destination)

    // Delay (pseudo-reverb)
    delayNode = audioContext.createDelay()
    delayNode.delayTime.value = 0.3

    feedbackGain = audioContext.createGain()
    feedbackGain.gain.value = 0.3

    delayNode.connect(feedbackGain)
    feedbackGain.connect(delayNode)
    delayNode.connect(masterGain)
  }
  return audioContext
}

// ============================================================
// Melody playback (Layer 1 + 2)
// ============================================================

function playNote(ctx: AudioContext, note: MusicNote, offset: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = "sine"
  osc.frequency.value = note.frequency

  // ADSR envelope
  const start = offset + note.startTime
  const attack = 0.01
  const decay = 0.1
  const sustainLevel = 0.7 * note.velocity
  const release = 0.3
  const end = start + note.duration

  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(note.velocity, start + attack)
  gain.gain.linearRampToValueAtTime(sustainLevel, start + attack + decay)
  gain.gain.setValueAtTime(sustainLevel, end)
  gain.gain.linearRampToValueAtTime(0, end + release)

  osc.connect(gain)
  gain.connect(masterGain!)
  gain.connect(delayNode!)

  osc.start(start)
  osc.stop(end + release + 0.1)

  scheduledSources.push(osc)
}

// ============================================================
// Accompaniment playback (Layer 3)
// ============================================================

// Accompaniment frequencies (one octave below melody range)
const C3 = 131
const E3 = 165
const G3 = 196

const CROSSFADE_DURATION = 0.5 // seconds

type PatternDef = {
  frequencies: number[]
  interval: number // seconds between notes
  volume: number
  noteDuration: number // how long each note sounds
}

const PATTERNS: Record<string, PatternDef | null> = {
  calm: {
    frequencies: [C3],
    interval: 0, // drone (continuous)
    volume: 0.15,
    noteDuration: 0, // filled in dynamically
  },
  walk: {
    frequencies: [C3, G3],
    interval: 0.5, // 8th note at ~120 BPM
    volume: 0.2,
    noteDuration: 0.45,
  },
  active: {
    frequencies: [C3, E3, G3, E3],
    interval: 0.25, // 16th note at ~120 BPM
    volume: 0.25,
    noteDuration: 0.2,
  },
  break: null, // silence
}

function scheduleAccompanimentSection(
  ctx: AudioContext,
  section: SectionInfo,
  offset: number,
  prevPattern: string | null,
  nextPattern: string | null,
  totalDuration: number
) {
  const patternDef = PATTERNS[section.pattern]
  if (!patternDef) return // break = silence

  const sectionStart = offset + section.startTime
  const sectionEnd = offset + section.endTime
  const sectionDuration = section.endTime - section.startTime

  if (sectionDuration <= 0) return

  // Tension scaling for accompaniment volume
  const sectionMidProgress =
    totalDuration > 0
      ? (section.startTime + section.endTime) / 2 / totalDuration
      : 0.5
  const t = tension(sectionMidProgress)
  const tensionScale = 0.5 + t // 0.8x – 1.2x range

  if (patternDef.interval === 0) {
    // Drone pattern (calm): one long oscillator for the section
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    osc.frequency.value = patternDef.frequencies[0]

    // Base volume with crossfade + tension
    const vol = patternDef.volume * tensionScale

    // Fade in at section boundary
    if (prevPattern !== section.pattern) {
      gain.gain.setValueAtTime(0, sectionStart)
      gain.gain.linearRampToValueAtTime(vol, sectionStart + CROSSFADE_DURATION)
    } else {
      gain.gain.setValueAtTime(vol, sectionStart)
    }

    // Sustain
    const sustainEnd = nextPattern !== section.pattern
      ? sectionEnd - CROSSFADE_DURATION
      : sectionEnd

    if (sustainEnd > sectionStart + CROSSFADE_DURATION) {
      gain.gain.setValueAtTime(vol, sustainEnd)
    }

    // Fade out at section boundary
    if (nextPattern !== section.pattern) {
      gain.gain.linearRampToValueAtTime(0, sectionEnd)
    }

    osc.connect(gain)
    gain.connect(masterGain!)

    osc.start(sectionStart)
    osc.stop(sectionEnd + 0.1)
    accompanimentSources.push(osc)
  } else {
    // Rhythmic pattern (walk, active): schedule individual notes
    const freqs = patternDef.frequencies
    const interval = patternDef.interval
    const noteDur = patternDef.noteDuration
    const vol = patternDef.volume * tensionScale

    // Crossfade: determine effective start/end with volume ramps
    const effectiveStart = prevPattern !== section.pattern
      ? sectionStart
      : sectionStart
    const effectiveEnd = sectionEnd

    let cursor = effectiveStart
    let noteIdx = 0

    while (cursor + noteDur <= effectiveEnd) {
      const freq = freqs[noteIdx % freqs.length]
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = "sine"
      osc.frequency.value = freq

      // Calculate volume with crossfade envelope
      const elapsed = cursor - sectionStart
      const remaining = sectionEnd - cursor
      let noteVol = vol

      // Fade in
      if (prevPattern !== section.pattern && elapsed < CROSSFADE_DURATION) {
        noteVol = vol * (elapsed / CROSSFADE_DURATION)
      }
      // Fade out
      if (nextPattern !== section.pattern && remaining < CROSSFADE_DURATION) {
        noteVol = vol * (remaining / CROSSFADE_DURATION)
      }

      // Simple envelope for each accompaniment note
      gain.gain.setValueAtTime(0, cursor)
      gain.gain.linearRampToValueAtTime(noteVol, cursor + 0.005)
      gain.gain.setValueAtTime(noteVol, cursor + noteDur - 0.01)
      gain.gain.linearRampToValueAtTime(0, cursor + noteDur)

      osc.connect(gain)
      gain.connect(masterGain!)

      osc.start(cursor)
      osc.stop(cursor + noteDur + 0.05)
      accompanimentSources.push(osc)

      cursor += interval
      noteIdx++
    }
  }
}

function playAccompaniment(
  ctx: AudioContext,
  sections: SectionInfo[],
  offset: number,
  totalDuration: number
) {
  stopAccompaniment()

  for (let i = 0; i < sections.length; i++) {
    const prevPattern = i > 0 ? sections[i - 1].pattern : null
    const nextPattern = i < sections.length - 1 ? sections[i + 1].pattern : null
    scheduleAccompanimentSection(
      ctx,
      sections[i],
      offset,
      prevPattern,
      nextPattern,
      totalDuration
    )
  }
}

function stopAccompaniment() {
  for (const osc of accompanimentSources) {
    try {
      osc.stop()
    } catch {
      // already stopped
    }
  }
  accompanimentSources = []
}

// ============================================================
// Public API
// ============================================================

export function playSequence(
  notes: MusicNote[],
  sections?: SectionInfo[]
): { duration: number; startedAt: number } {
  const ctx = getContext()
  stop()

  const offset = ctx.currentTime + 0.1

  // Melody
  for (const note of notes) {
    playNote(ctx, note, offset)
  }

  const duration =
    notes.length > 0
      ? notes[notes.length - 1].startTime +
        notes[notes.length - 1].duration +
        0.3
      : 0

  // Accompaniment (Layer 3)
  if (sections && sections.length > 0) {
    playAccompaniment(ctx, sections, offset, duration)
  }

  if (notes.length === 0) return { duration: 0, startedAt: offset }
  return {
    duration,
    startedAt: offset,
  }
}

export function getContextTime(): number {
  return audioContext?.currentTime ?? 0
}

export function stop() {
  for (const osc of scheduledSources) {
    try {
      osc.stop()
    } catch {
      // already stopped
    }
  }
  scheduledSources = []
  stopAccompaniment()
}
