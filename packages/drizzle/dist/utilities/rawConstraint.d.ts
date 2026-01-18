export declare const DistinctSymbol: unique symbol;
/**
 * You can use this to inject a raw query to where
 */
export declare const rawConstraint: (value: unknown) => {
    type: symbol;
    value: unknown;
};
export declare const isRawConstraint: (value: unknown) => value is ReturnType<typeof rawConstraint>;
//# sourceMappingURL=rawConstraint.d.ts.map