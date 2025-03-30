/**
 * query + $dynamic() should be preferred instead: https://orm.drizzle.team/docs/dynamic-query-building
 */
export type ChainedMethods = {
  args: unknown[]
  method: string
}[]

/**
 * Call and returning methods that would normally be chained together but cannot be because of control logic
 * @param methods
 * @param query
 *
 * query + $dynamic() should be preferred instead: https://orm.drizzle.team/docs/dynamic-query-building.
 * chainMethods can still be useful if query needs to be built bottom-up.
 */
const chainMethods = <T>({ methods, query }: { methods: ChainedMethods; query: T }): T => {
  return methods.reduce((query, { args, method }) => {
    return query[method](...args)
  }, query)
}

export { chainMethods }
