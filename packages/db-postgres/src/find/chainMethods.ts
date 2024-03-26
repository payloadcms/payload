import type { QueryPromise } from 'drizzle-orm'

export type ChainedMethods = {
  args: unknown[]
  method: string
}[]

/**
 * Call and returning methods that would normally be chained together but cannot be because of control logic
 * @param methods
 * @param query
 */
const chainMethods = <T>({ methods, query }): QueryPromise<T> => {
  return methods.reduce((query, { args, method }) => {
    return query[method](...args)
  }, query)
}

export { chainMethods }
