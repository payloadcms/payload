import type { PayloadRequest, Sort, Where } from '../../../types/index.js'

import { isNestedRelationshipQuery } from '../../../database/isNestedRelationshipQuery.js'
import { compileBranchProjectionPath } from '../queries/compileBranchProjectionWhere.js'

/** Only user-authored relation hops require target read callbacks during an original read. */
export const collectOriginalReadTargets = ({
  collection,
  req,
  sort,
  where,
}: {
  collection: string
  req: PayloadRequest
  sort?: Sort
  where?: Where
}): Set<string> => {
  const targets = new Set<string>()
  const pathTargets = ({ collection, path }: { collection: string; path: string }) => {
    const segments = path.replace(/__/g, '.').split('.')
    for (let length = 1; length <= segments.length; length++) {
      const resolved = compileBranchProjectionPath({
        collection,
        path: segments.slice(0, length).join('.'),
        req,
      })
      if (resolved.kind === 'relationship') {
        for (const target of resolved.targets) {
          targets.add(target)
        }
      }
    }
    return compileBranchProjectionPath({ collection, path, req })
  }
  const visit = ({ collection, where }: { collection: string; where?: Where }) => {
    for (const [path, condition] of Object.entries(where ?? {})) {
      if (['and', 'or'].includes(path.toLowerCase()) && Array.isArray(condition)) {
        for (const child of condition) {
          visit({ collection, where: child })
        }
        continue
      }
      const resolved = pathTargets({ collection, path })
      if (
        resolved.kind === 'relationship' &&
        resolved.targets.length === 1 &&
        condition &&
        !Array.isArray(condition)
      ) {
        for (const value of Object.values(condition)) {
          if (isNestedRelationshipQuery(value) && !Object.hasOwn(value, 'relationTo')) {
            visit({ collection: resolved.targets[0]!, where: value })
          }
        }
      }
    }
  }
  visit({ collection, where })
  for (const item of typeof sort === 'string' ? [sort] : (sort ?? [])) {
    pathTargets({ collection, path: item.replace(/^-/, '') })
  }
  return targets
}
