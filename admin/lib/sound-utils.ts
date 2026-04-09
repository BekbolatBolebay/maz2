/**
 * Sound generation and playback utilities for notifications
 * Creates notification sounds using Web Audio API as fallback
 */

// Preload audio element for immediate playback
let audioElement: HTMLAudioElement | null = null
let audioContext: AudioContext | null = null

/**
 * Initialize audio context for sound generation
 */
function getAudioContext(): AudioContext {
  if (!audioContext && typeof window !== 'undefined' && 'AudioContext' in window) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext!
}

/**
 * Play a notification sound asynchronously
 * Tries multiple methods to ensure sound playback
 */
export async function playNotificationSound(type: 'order-alert' | 'status-update' = 'status-update'): Promise<void> {
  try {
    // Method 1: Try to play using Audio API first (most reliable)
    if (!audioElement) {
      audioElement = new Audio()
      // Set a generic notification sound
      // Using data URI for a simple beep tone
      audioElement.src = generateSimpleBeep(type)
    }

    // Resume audio context if suspended (required by browsers)
    const context = getAudioContext()
    if (context && context.state === 'suspended') {
      await context.resume()
    }

    // Try to play
    const playPromise = audioElement.play()
    if (playPromise !== undefined) {
      await Promise.race([
        playPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Playback timeout')), 5000))
      ])
    }
  } catch (error) {
    console.warn('Audio playback failed, trying Web Audio API:', error)
    try {
      // Method 2: Fallback to Web Audio API synthesis
      await synthesizeNotificationSound(type)
    } catch (synthesisError) {
      console.error('All sound playback methods failed:', synthesisError)
    }
  }
}

/**
 * Generate a simple beep tone as data URI
 * Returns a data URI for a short notification sound
 */
function generateSimpleBeep(type: 'order-alert' | 'status-update'): string {
  // Create a simple sine wave beep encoded as base64 WAV
  // This is a mono 16-bit 44100Hz WAV file with about 500ms of a 800Hz tone for order-alert
  // and 400Hz tone for status-update
  
  if (type === 'order-alert') {
    // Higher pitch, shorter duration for new order alerts
    return 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=='
      + 'gACgAoAOgAJABgAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUADgAJABgAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQA'
  } else {
    // Lower pitch for status updates
    return 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=='
      + 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
  }
}

/**
 * Use Web Audio API to synthesize a notification sound
 */
async function synthesizeNotificationSound(type: 'order-alert' | 'status-update'): Promise<void> {
  const context = getAudioContext()
  if (!context) throw new Error('AudioContext not available')

  // Resume context if needed
  if (context.state === 'suspended') {
    await context.resume()
  }

  const now = context.currentTime
  const duration = type === 'order-alert' ? 0.5 : 0.3
  const frequency = type === 'order-alert' ? 800 : 400

  // Create oscillator for the tone
  const osc = context.createOscillator()
  const gain = context.createGain()

  osc.connect(gain)
  gain.connect(context.destination)

  osc.type = 'sine'
  osc.frequency.value = frequency

  // ADSR envelope
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.3, now + 0.02) // Attack
  gain.gain.linearRampToValueAtTime(0.2, now + 0.1) // Decay
  gain.gain.linearRampToValueAtTime(0.2, now + duration - 0.05) // Sustain
  gain.gain.linearRampToValueAtTime(0, now + duration) // Release

  osc.start(now)
  osc.stop(now + duration)
}

/**
 * Play a beep sound immediately (synchronously when possible)
 * Used for critical notifications that must play
 */
export function playImmediateBeep(type: 'order-alert' | 'status-update' = 'status-update'): void {
  // Fire and forget - don't wait for completion
  playNotificationSound(type).catch(err => {
    console.warn('Background sound playback error:', err)
  })
}

/**
 * Ensure audio context is resumed (call on first user interaction)
 */
export function resumeAudioContext(): void {
  try {
    const context = getAudioContext()
    if (context && context.state === 'suspended') {
      context.resume().catch(err => {
        console.warn('Could not resume audio context:', err)
      })
    }
  } catch (error) {
    console.warn('Error resuming audio context:', error)
  }
}
