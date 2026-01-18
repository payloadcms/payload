/** Remove a leading '-' from a sort value (e.g. "-title" -> "title") */
export declare const stripSortDash: (v?: null | string) => string;
/** Apply order to a base field (("title","desc") -> "-title") */
export declare const applySortOrder: (field: string, order: "asc" | "desc") => string;
export declare const normalizeQueryParam: (v: unknown) => string | undefined;
//# sourceMappingURL=sortHelpers.d.ts.map