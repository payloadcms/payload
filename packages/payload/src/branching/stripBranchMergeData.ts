import type { Field } from '../fields/config/types.js'
import type { JsonObject } from '../types/index.js'

import { isManagedAuthorshipField } from '../fields/baseFields/authorship/index.js'
import { branchDocIDField, branchField } from './types.js'

type Args = {
  data: Record<string, unknown>
  fields: Field[]
}

/** Removes values that Payload, rather than a content author, owns during a merge write. */
export const stripBranchMergeData = ({ data, fields }: Args): JsonObject => {
  const {
    id: _id,
    [branchDocIDField]: _docID,
    [branchField]: _branch,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...mergeData
  } = data

  for (const field of fields) {
    if (isManagedAuthorshipField(field)) {
      delete mergeData[field.name]
    }
  }

  return mergeData as JsonObject
}

export const stripBranchMergeGlobalData = ({ data, fields }: Args): JsonObject => {
  const { globalType: _globalType, ...globalData } = data

  return stripBranchMergeData({ data: globalData, fields })
}
