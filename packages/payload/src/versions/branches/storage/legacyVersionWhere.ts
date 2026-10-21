import type { Where } from '../../../types/index.js'

/** Internal branch snapshots retain historical statuses but never replace legacy draft/history views. */
export const legacyVersionWhere = ({
  entity,
  where,
}: {
  entity: { custom?: Record<string, unknown> }
  where: Where
}): Where =>
  entity.custom?.branchStorage
    ? {
        and: [
          where,
          { or: [{ branchOnly: { exists: false } }, { branchOnly: { equals: false } }] },
        ],
      }
    : where
