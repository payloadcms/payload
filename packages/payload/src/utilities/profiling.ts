type ProfileEntry = {
  calls: number
  duration: number
  name: string
}

const profiles = new Map<string, ProfileEntry>()
const callStack: string[] = []

export const timeSync = <T>(name: string, fn: () => T): T => {
  callStack.push(name)
  const start = performance.now()
  try {
    return fn()
  } finally {
    const duration = performance.now() - start
    callStack.pop()
    const entry = profiles.get(name) || { name, calls: 0, duration: 0 }
    entry.duration += duration
    entry.calls++
    profiles.set(name, entry)
  }
}

export const timeAsync = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  callStack.push(name)
  const start = performance.now()
  try {
    return await fn()
  } finally {
    const duration = performance.now() - start
    callStack.pop()
    const entry = profiles.get(name) || { name, calls: 0, duration: 0 }
    entry.duration += duration
    entry.calls++
    profiles.set(name, entry)
  }
}

export const clearProfiles = () => {
  profiles.clear()
}

export const printProfileResults = () => {
  const entries = Array.from(profiles.values()).sort((a, b) => b.duration - a.duration)

  console.log('\n=== Profile Results ===')
  console.log('Name'.padEnd(50) + 'Duration (ms)'.padStart(15) + 'Calls'.padStart(10))
  console.log('-'.repeat(75))

  for (const entry of entries) {
    console.log(
      entry.name.padEnd(50) +
        entry.duration.toFixed(2).padStart(15) +
        String(entry.calls).padStart(10),
    )
  }

  console.log('='.repeat(75) + '\n')
}

export const getProfileResults = () => {
  return Array.from(profiles.values()).sort((a, b) => b.duration - a.duration)
}
