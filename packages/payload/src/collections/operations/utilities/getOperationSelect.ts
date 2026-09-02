import type { PayloadRequest, SelectFnOperation, SelectType } from '../../../types/index.js'
import type { SanitizedCollectionConfig } from '../../config/types.js'

import { resolveSelect } from '../../../utilities/resolveSelect.js'
import { sanitizeSelect } from '../../../utilities/sanitizeSelect.js'

/**
 * Resolves and sanitizes the `select` projection for a collection operation — the same
 * `resolveSelect` + `sanitizeSelect` pairing every operation file (create/update/delete/find)
 * previously repeated inline.
 */
export const getOperationSelect = ({
  collectionConfig,
  incomingSelect,
  operation,
  req,
}: {
  collectionConfig: SanitizedCollectionConfig
  incomingSelect: SelectType | undefined
  operation: SelectFnOperation
  req: PayloadRequest
}): SelectType | undefined =>
  sanitizeSelect({
    fields: collectionConfig.flattenedFields,
    select: resolveSelect({
      config: collectionConfig.select,
      operation,
      req,
      select: incomingSelect,
    }),
  })
