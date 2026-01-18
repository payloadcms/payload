import type { BaseFilter } from 'payload';
type Args = {
    baseFilter?: BaseFilter;
    customFilter: BaseFilter;
};
/**
 * Combines a base filter with a tenant list filter
 *
 * Combines where constraints inside of an AND operator
 */
export declare const combineFilters: ({ baseFilter, customFilter }: Args) => BaseFilter;
export {};
//# sourceMappingURL=combineFilters.d.ts.map