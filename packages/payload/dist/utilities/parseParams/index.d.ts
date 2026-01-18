import type { JoinQuery, PopulateType, SelectType, Where } from '../../types/index.js';
import type { JoinParams } from '../sanitizeJoinParams.js';
type ParsedParams = {
    autosave?: boolean;
    data?: Record<string, unknown>;
    depth?: number;
    draft?: boolean;
    field?: string;
    flattenLocales?: boolean;
    joins?: JoinQuery;
    limit?: number;
    overrideLock?: boolean;
    page?: number;
    pagination?: boolean;
    populate?: PopulateType;
    publishSpecificLocale?: string;
    select?: SelectType;
    selectedLocales?: string[];
    sort?: string[];
    trash?: boolean;
    where?: Where;
} & Record<string, unknown>;
type RawParams = {
    [key: string]: unknown;
    autosave?: string;
    data?: string;
    depth?: string;
    draft?: string;
    field?: string;
    flattenLocales?: string;
    joins?: JoinParams;
    limit?: string;
    overrideLock?: string;
    page?: string;
    pagination?: string;
    populate?: unknown;
    publishSpecificLocale?: string;
    select?: unknown;
    selectedLocales?: string;
    sort?: string | string[];
    trash?: string;
    where?: Where;
};
export declare const booleanParams: string[];
export declare const numberParams: string[];
/**
 * Takes raw query parameters and parses them into the correct types that Payload expects.
 * Examples:
 *   a. `draft` provided as a string of "true" is converted to a boolean
 *   b. `depth` provided as a string of "0" is converted to a number
 *   c. `sort` provided as a comma-separated string or array is converted to an array of strings
 */
export declare const parseParams: (params: RawParams) => ParsedParams;
export {};
//# sourceMappingURL=index.d.ts.map