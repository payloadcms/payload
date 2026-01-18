/**
 * Globals that are used by our integration tests to modify the behavior of the job system during runtime.
 * This is useful to avoid having to wait for the cron jobs to run, or to pause auto-running jobs.
 */ export const _internal_jobSystemGlobals = {
    getCurrentDate: ()=>{
        return new Date();
    },
    shouldAutoRun: true,
    shouldAutoSchedule: true
};
export function _internal_resetJobSystemGlobals() {
    _internal_jobSystemGlobals.getCurrentDate = ()=>new Date();
    _internal_jobSystemGlobals.shouldAutoRun = true;
    _internal_jobSystemGlobals.shouldAutoSchedule = true;
}
export const getCurrentDate = ()=>{
    return _internal_jobSystemGlobals.getCurrentDate();
};

//# sourceMappingURL=getCurrentDate.js.map