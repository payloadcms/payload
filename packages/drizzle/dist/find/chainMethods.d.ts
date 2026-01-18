/**
 * @deprecated - will be removed in 4.0. Use query + $dynamic() instead: https://orm.drizzle.team/docs/dynamic-query-building
 */
export type ChainedMethods = {
    args: unknown[];
    method: string;
}[];
/**
 * Call and returning methods that would normally be chained together but cannot be because of control logic
 * @param methods
 * @param query
 *
 * @deprecated - will be removed in 4.0. Use query + $dynamic() instead: https://orm.drizzle.team/docs/dynamic-query-building
 */
declare const chainMethods: <T>({ methods, query }: {
    methods: ChainedMethods;
    query: T;
}) => T;
export { chainMethods };
//# sourceMappingURL=chainMethods.d.ts.map