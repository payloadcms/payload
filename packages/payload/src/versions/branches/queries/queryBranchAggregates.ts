import type { CountArgs, FindDistinctArgs } from '../../../database/types.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { BranchHeadID } from '../types.js'

import {
  compileBranchProjectionPath,
  compileBranchProjectionSort,
  compileBranchProjectionWhere,
} from './compileBranchProjectionWhere.js'
import { prepareBranchContentQuery } from './queryBranchContent.js'
import { withBranchReadSnapshot } from './withBranchReadSnapshot.js'

type BranchArgs = { branchID: BranchHeadID; overrideAccess?: boolean; req: PayloadRequest }

/** Count the native effective relation; never fetch content IDs to count in core. */
export const countBranchContent = async (args: BranchArgs & Omit<CountArgs, 'req'>) => {
  return withBranchReadSnapshot({
    locale: args.locale,
    read: ({ req }) => countRawBranchContent({ ...args, req }),
    req: args.req,
  })
}

const countRawBranchContent = async (args: BranchArgs & Omit<CountArgs, 'req'>) => {
  const prepared = await prepareBranchContentQuery(args)
  const result = await prepared.query.count({
    collection: prepared.storage.projection,
    context: prepared.context,
    locale: prepared.locale,
    req: args.req,
    where: compileBranchProjectionWhere(args),
  })

  return result
}

/** Distinct/sort operands use actual typed logical identities inside the database. */
export const findDistinctBranchContent = async (
  args: BranchArgs & Omit<FindDistinctArgs, 'req'>,
) => {
  return withBranchReadSnapshot({
    locale: args.locale,
    read: ({ req }) => findRawDistinctBranchContent({ ...args, req }),
    req: args.req,
  })
}

const findRawDistinctBranchContent = async (args: BranchArgs & Omit<FindDistinctArgs, 'req'>) => {
  const prepared = await prepareBranchContentQuery({
    ...args,
    observedField: args.field,
    observedSort: args.sort ?? args.field,
  })
  const resolved = compileBranchProjectionPath({
    collection: args.collection,
    path: args.field,
    req: args.req,
  })
  const field =
    resolved.kind === 'relationship' && resolved.targets.length === 1
      ? compileBranchProjectionSort({
          collection: args.collection,
          req: args.req,
          sort: args.field,
        })[0]!
      : resolved.path
  const sort = args.sort ? compileBranchProjectionSort(args) : field
  const result = await prepared.query.findDistinct({
    ...args,
    collection: prepared.storage.projection,
    context: prepared.context,
    field,
    locale: prepared.locale,
    sort,
    where: compileBranchProjectionWhere(args),
  })

  return {
    ...result,
    values: result.values.map((item) => {
      let value = item[field]
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        'relationTo' in value &&
        typeof value.relationTo === 'string'
      ) {
        value = {
          ...value,
          relationTo:
            Object.keys(prepared.projectionSlugs).find(
              (slug) => prepared.projectionSlugs[slug] === value.relationTo,
            ) ?? value.relationTo,
        }
      }
      return { [args.field]: value }
    }),
  }
}
