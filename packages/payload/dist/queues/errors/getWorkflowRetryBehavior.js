import { calculateBackoffWaitUntil } from './calculateBackoffWaitUntil.js';
/**
 * Assuming there is no task that has already reached max retries,
 * this function determines if the workflow should retry the job
 * and if so, when it should retry.
 */ export function getWorkflowRetryBehavior({ job, retriesConfig }) {
    const maxWorkflowRetries = typeof retriesConfig === 'object' ? retriesConfig.attempts : retriesConfig;
    if (maxWorkflowRetries !== undefined && maxWorkflowRetries !== null && job.totalTried >= maxWorkflowRetries) {
        return {
            hasFinalError: true,
            maxWorkflowRetries
        };
    }
    if (!retriesConfig) {
        // No retries provided => assuming no task reached max retries, we can retry
        return {
            hasFinalError: false,
            maxWorkflowRetries: undefined,
            waitUntil: undefined
        };
    }
    // Job will retry. Let's determine when!
    const waitUntil = calculateBackoffWaitUntil({
        retriesConfig,
        totalTried: job.totalTried ?? 0
    });
    return {
        hasFinalError: false,
        maxWorkflowRetries,
        waitUntil
    };
}

//# sourceMappingURL=getWorkflowRetryBehavior.js.map