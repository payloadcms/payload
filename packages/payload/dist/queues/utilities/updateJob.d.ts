import type { Job } from '../../index.js';
import type { PayloadRequest, Sort, Where } from '../../types/index.js';
type BaseArgs = {
    data: Partial<Job>;
    depth?: number;
    disableTransaction?: boolean;
    limit?: number;
    req: PayloadRequest;
    returning?: boolean;
};
type ArgsByID = {
    id: number | string;
    limit?: never;
    sort?: never;
    where?: never;
};
type ArgsWhere = {
    id?: never;
    limit?: number;
    sort?: Sort;
    where: Where;
};
type RunJobsArgs = (ArgsByID | ArgsWhere) & BaseArgs;
/**
 * Convenience method for updateJobs by id
 */
export declare function updateJob(args: ArgsByID & BaseArgs): Promise<Job | undefined>;
/**
 * Helper for updating jobs in the most performant way possible.
 * Handles deciding whether it can used direct db methods or not, and if so,
 * manually runs the afterRead hook that populates the `taskStatus` property.
 */
export declare function updateJobs({ id, data, depth, disableTransaction, limit: limitArg, req, returning, sort, where: whereArg, }: RunJobsArgs): Promise<Job[] | null>;
export {};
//# sourceMappingURL=updateJob.d.ts.map