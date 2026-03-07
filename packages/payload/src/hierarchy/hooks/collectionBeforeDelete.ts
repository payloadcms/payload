/**
 * beforeChange Hook Responsibilities:
 * - Validate circular references when parent changes
 *
 * Does NOT handle:
 * - Tree structure (no stored tree anymore)
 * - Path computation (done in afterRead)
 */

import type { CollectionBeforeDeleteHook } from '../../index.js'

type Args = {
  /**
   * The name of the field that contains the parent document ID
   */
  parentFieldName: string
}

export const hierarchyCollectionBeforeDelete =
  ({ parentFieldName }: Args): CollectionBeforeDeleteHook =>
  ({ req }) => {
    req.context = req.context || {}
    req.context.isDeleting = true
    return
  }
