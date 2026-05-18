import { workUnitAsyncStorage } from 'next/dist/server/app-render/work-unit-async-storage.external.js'

/**
 * Clears Next.js work unit storage for this async scope so job handlers can call
 * `revalidatePath` / `revalidateTag` without being attributed to the App Router render phase.
 */
export function wrapPayloadJobsRunnerForNext(run: () => Promise<void>): Promise<void> {
  return workUnitAsyncStorage.run(undefined as never, run)
}
