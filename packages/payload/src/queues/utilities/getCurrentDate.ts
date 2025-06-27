/**
 * Globals that can be used by our integration tests to modify the behavior of the job system.
 * This is useful to avoid having to wait for the cron jobs to run, or to pause auto-running jobs.
 */
export const _internal_jobSystemGlobals = {
  getCurrentDate: () => {
    return new Date()
  },
  shouldAutoRun: true,
  shouldAutoSchedule: true,
}

export const getCurrentDate: () => Date = () => {
  return _internal_jobSystemGlobals.getCurrentDate()
}
