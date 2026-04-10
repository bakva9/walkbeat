import type { MusicNote } from "./generateMusic"

let audioContext: AudioContext | null = null
let delayNode: DelayNode | null = null
let feedbackGain: GainNode | null = null
let masterGain: GainNode | null = null
let scheduledSources: OscillatorNode[] = []

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

export function playSequence(notes: MusicNote[]): number {
  const ctx = getContext()
  stop()

  const offset = ctx.currentTime + 0.1

  for (const note of notes) {
    playNote(ctx, note, offset)
  }

  // Return total duration
  if (notes.length === 0) return 0
  const last = notes[notes.length - 1]
  return last.startTime + last.duration + 0.3
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
}
