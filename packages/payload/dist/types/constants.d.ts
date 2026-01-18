export declare const validOperators: readonly ["equals", "contains", "not_equals", "in", "all", "not_in", "exists", "greater_than", "greater_than_equal", "less_than", "less_than_equal", "like", "not_like", "within", "intersects", "near"];
export type Operator = (typeof validOperators)[number];
export declare const validOperatorSet: Set<"all" | "contains" | "equals" | "exists" | "intersects" | "near" | "within" | "not_equals" | "in" | "not_in" | "greater_than" | "greater_than_equal" | "less_than" | "less_than_equal" | "like" | "not_like">;
//# sourceMappingURL=constants.d.ts.map