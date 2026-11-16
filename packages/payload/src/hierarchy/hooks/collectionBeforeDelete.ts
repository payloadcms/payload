import type { CollectionBeforeDeleteHook } from '../../index.js'

import { promoteHierarchyChildren } from '../promoteHierarchyChildren.js'

type Args = { parentFieldName: string }

export const hierarchyCollectionBeforeDelete =
  ({ parentFieldName }: Args): CollectionBeforeDeleteHook =>
  async ({ id, collection, req }) => {
    await promoteHierarchyChildren({ id, collection, parentFieldName, req })
  }
