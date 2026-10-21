import type { BranchProjectionQueryContext } from '../../../database/branching.js'
import type { JoinQuery, PayloadRequest } from '../../../types/index.js'
import type { BranchHeadID } from '../types.js'

import { combineQueries } from '../../../database/combineQueries.js'
import {
  collectBranchQueryLocales,
  compileBranchProjectionSort,
  compileBranchProjectionWhere,
} from './compileBranchProjectionWhere.js'

/** Merge original schema defaults once, then translate independently for each union target. */
export const prepareBranchProjectionJoins = ({
  branchID,
  collection,
  joins,
  req,
}: {
  branchID: BranchHeadID
  collection: string
  joins?: JoinQuery
  req: PayloadRequest
}): { joins: NonNullable<BranchProjectionQueryContext['joins']>; locales: string[] } => {
  const result: NonNullable<BranchProjectionQueryContext['joins']> = {}
  const locales = new Set<string>()
  if (joins === false) {
    return { joins: result, locales: [] }
  }
  const root = req.payload.collections[collection]!.config
  for (const definition of [
    ...Object.values(root.joins ?? {}).flat(),
    ...(root.polymorphicJoins ?? []),
  ]) {
    if (joins?.[definition.joinPath] === false) {
      continue
    }
    const options = joins?.[definition.joinPath] || {}
    const { field } = definition
    const isPolymorphic = Array.isArray(field.collection)
    const targets = typeof field.collection === 'string' ? [field.collection] : field.collection
    const where = combineQueries(options.where ?? {}, field.where ?? {})
    const targetOptions: NonNullable<BranchProjectionQueryContext['joins']>[string] = {}
    const targetDefaults = targets.map((target) => {
      const config = req.payload.collections[target]!.config
      return config.defaultSort ?? (config.timestamps ? '-createdAt' : '-id')
    })
    // A union has one ordering. Conflicting target defaults use a common schema path,
    // and unused target defaults must not add unrelated locale readiness dependencies.
    const defaultSort = targetDefaults.every(
      (sort) => JSON.stringify(sort) === JSON.stringify(targetDefaults[0]),
    )
      ? targetDefaults[0]
      : targets.every((target) => req.payload.collections[target]!.config.timestamps)
        ? '-createdAt'
        : 'id'
    const sort = options.sort ?? field.defaultSort ?? defaultSort
    for (const target of targets) {
      for (const locale of collectBranchQueryLocales({
        allowMissingFields: isPolymorphic,
        collection: target,
        req,
        sort,
        where,
      })) {
        locales.add(locale)
      }
      const prepared = {
        ...options,
        sort: compileBranchProjectionSort({
          allowMissingFields: isPolymorphic,
          collection: target,
          req,
          sort,
        }),
        where: compileBranchProjectionWhere({
          allowMissingFields: isPolymorphic,
          branchID,
          collection: target,
          req,
          where,
        }),
      }
      targetOptions[target] = prepared
      const projection =
        req.payload.collections[target]!.config.custom?.branchQueryStorage?.projection
      if (typeof projection === 'string') {
        targetOptions[projection] = prepared
      }
    }
    result[definition.joinPath] = targetOptions
  }
  return { joins: result, locales: [...locales] }
}
