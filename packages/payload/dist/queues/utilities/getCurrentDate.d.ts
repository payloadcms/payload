/**
 * Globals that are used by our integration tests to modify the behavior of the job system during runtime.
 * This is useful to avoid having to wait for the cron jobs to run, or to pause auto-running jobs.
 */
export declare const _internal_jobSystemGlobals: {
    getCurrentDate: () => Date;
    shouldAutoRun: boolean;
    shouldAutoSchedule: boolean;
};
export declare function _internal_resetJobSystemGlobals(): void;
export declare const getCurrentDate: () => Date;
//# sourceMappingURL=getCurrentDate.d.ts.map