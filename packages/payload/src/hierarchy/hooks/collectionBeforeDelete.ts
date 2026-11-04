import type { CollectionBeforeDeleteHook } from '../../index.js'

import { deleteHierarchyChildren } from '../deleteHierarchyChildren.js'

type Args = {
  /**
   * The name of the field that contains the parent document ID
   */
  parentFieldName: string
}

export const hierarchyCollectionBeforeDelete =
  ({ parentFieldName }: Args): CollectionBeforeDeleteHook =>
  async ({ id, collection, req }) => {
    await deleteHierarchyChildren({ id, collection, parentFieldName, req })
  }
