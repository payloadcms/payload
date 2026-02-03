/**
 * Timing utility - monkey-patches console.log to show timing info.
 * Import this FIRST in the config loading chain.
 */
const startTime = Date.now()
let lastCallTime = startTime

const originalLog = console.log.bind(console)

console.log = (...args: unknown[]) => {
  const now = Date.now()
  const sinceStart = now - startTime
  const sinceLast = now - lastCallTime

  lastCallTime = now
  originalLog(`[${sinceStart}ms total, +${sinceLast}ms]`, ...args)
}

console.log('Payload lazy loading started')

export function logTiming(message: string): void {
  console.log(message)
}
