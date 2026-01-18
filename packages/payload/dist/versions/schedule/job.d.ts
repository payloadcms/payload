import type { TaskConfig } from '../../queues/config/types/taskTypes.js';
import type { SchedulePublishTaskInput } from './types.js';
type Args = {
    adminUserSlug: string;
    collections: string[];
    globals: string[];
};
export declare const getSchedulePublishTask: ({ adminUserSlug, collections, globals, }: Args) => TaskConfig<{
    input: SchedulePublishTaskInput;
    output: object;
}>;
export {};
//# sourceMappingURL=job.d.ts.map