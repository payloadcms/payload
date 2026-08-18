/**
 * Globals that are used by our integration tests to modify the behavior of the job system during runtime.
 * This is useful to avoid having to wait for the cron jobs to run, or to pause auto-running jobs.
 *
 * @internal
 */
export const jobSystemGlobals = {
  getCurrentDate: () => {
    return new Date()
  },
  shouldAutoRun: true,
  shouldAutoSchedule: true,
}

/** @internal */
export function resetJobSystemGlobals() {
  jobSystemGlobals.getCurrentDate = () => new Date()
  jobSystemGlobals.shouldAutoRun = true
  jobSystemGlobals.shouldAutoSchedule = true
}

/** @internal */
export const getCurrentDate: () => Date = () => {
  return jobSystemGlobals.getCurrentDate()
}
