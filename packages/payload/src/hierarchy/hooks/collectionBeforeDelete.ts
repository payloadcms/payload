import type { CollectionBeforeDeleteHook } from '../../index.js'

import { applyHierarchyDeleteStrategy } from '../applyHierarchyDeleteStrategy.js'

type Args = { parentFieldName: string }

export const hierarchyCollectionBeforeDelete =
  ({ parentFieldName }: Args): CollectionBeforeDeleteHook =>
  async ({ id, collection, req }) => {
    await applyHierarchyDeleteStrategy({ id, collection, parentFieldName, req })
  }
