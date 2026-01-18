import type { Job } from '../../index.js';
import type { JobTaskStatus } from '../config/types/workflowTypes.js';
type Args = {
    jobLog: Job['log'];
};
export declare const getJobTaskStatus: ({ jobLog }: Args) => JobTaskStatus;
export {};
//# sourceMappingURL=getJobTaskStatus.d.ts.map