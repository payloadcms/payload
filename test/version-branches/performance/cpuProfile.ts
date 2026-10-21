import { writeFile } from 'node:fs/promises'
import { Session } from 'node:inspector/promises'

/** Run in the actual integration worker; profiling the Vitest controller misses Payload execution. */
export const profileBranchPerformance = async ({
  file,
  iterations,
  run,
}: {
  file: string
  iterations: number
  run: () => Promise<unknown>
}) => {
  const session = new Session()

  session.connect()
  try {
    await session.post('Profiler.enable')
    await session.post('Profiler.start')
    for (let iteration = 0; iteration < iterations; iteration++) {
      await run()
    }
    const { profile } = await session.post('Profiler.stop')

    await writeFile(file, JSON.stringify(profile))
    return file
  } finally {
    session.disconnect()
  }
}
