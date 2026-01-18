import type { FilterOptions, FilterOptionsProps, ResolvedFilterOptions } from 'payload';
export declare const resolveFilterOptions: (filterOptions: FilterOptions, options: {
    relationTo: string | string[];
} & Omit<FilterOptionsProps, "relationTo">) => Promise<ResolvedFilterOptions>;
//# sourceMappingURL=resolveFilterOptions.d.ts.map