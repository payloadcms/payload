import type { JoinQuery } from '../types/index.js';
export type JoinParams = {
    [schemaPath: string]: {
        limit?: unknown;
        sort?: string;
        where?: unknown;
    } | false;
} | false;
/**
 * Convert request JoinQuery object from strings to numbers
 * @param joins
 */
export declare const sanitizeJoinParams: (_joins?: JoinParams) => JoinQuery;
//# sourceMappingURL=sanitizeJoinParams.d.ts.map