import type { SanitizedJobsConfig, ScheduleConfig } from '../../config/types/index.js';
import type { TaskConfig } from '../../config/types/taskTypes.js';
import type { WorkflowConfig } from '../../config/types/workflowTypes.js';
type QueuesWithSchedules = {
    [queue: string]: {
        schedules: {
            scheduleConfig: ScheduleConfig;
            taskConfig?: TaskConfig;
            workflowConfig?: WorkflowConfig;
        }[];
    };
};
export declare const getQueuesWithSchedules: ({ jobsConfig, }: {
    jobsConfig: SanitizedJobsConfig;
}) => QueuesWithSchedules;
export {};
//# sourceMappingURL=getQueuesWithSchedules.d.ts.map