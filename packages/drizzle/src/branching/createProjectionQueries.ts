import type { BranchProjectionQueries, BranchProjectionQueryContext } from 'payload'

import { combineQueries } from 'payload'

import type { DrizzleAdapter } from '../types.js'

import { count } from '../count.js'
import { findGlobal } from '../findGlobal.js'
import { findProjection } from './findProjection.js'
import { findProjectionDistinct } from './findProjectionDistinct.js'

export const projectionQueryContext = Symbol('payload.branchProjectionQueryContext')
export const projectionCompilingAccess = Symbol('payload.branchProjectionCompilingAccess')

export type ProjectionQueryAdapter = {
  [projectionCompilingAccess]?: boolean
  [projectionQueryContext]?: BranchProjectionQueryContext
} & DrizzleAdapter

/** A request-local adapter view keeps trusted relation predicates out of shared adapter state. */
export const createProjectionQueries = ({
  adapter,
}: {
  adapter: DrizzleAdapter
}): BranchProjectionQueries => {
  const scopedAdapter = ({
    context,
  }: {
    context: BranchProjectionQueryContext
  }): ProjectionQueryAdapter =>
    Object.assign(Object.create(adapter), {
      [projectionQueryContext]: context,
    }) as ProjectionQueryAdapter

  return {
    count: ({ context, ...args }) => count.call(scopedAdapter({ context }), args),
    find: ({ context, ...args }) => findProjection.call(scopedAdapter({ context }), args),
    findDistinct: ({ context, ...args }) =>
      findProjectionDistinct.call(scopedAdapter({ context }), args),
    findGlobal: ({ context, ...args }) =>
      context.rootAccess?.where === false
        ? Promise.resolve({})
        : findGlobal.call(scopedAdapter({ context }), {
            ...args,
            where: combineQueries(context.rootAccess?.where, args.where),
          }),
  }
}
