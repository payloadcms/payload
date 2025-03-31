import ObjectIdImport from 'bson-objectid'

import type { BaseJob } from '../config/types/workflowTypes.js'

const ObjectId = (ObjectIdImport.default ||
  ObjectIdImport) as unknown as typeof ObjectIdImport.default

/**
 * Our payload operations sanitize the input data to, for example, add missing IDs to array rows.
 * This function is used to manually sanitize the data for direct db adapter operations
 */
export function sanitizeUpdateData({ data }: { data: Partial<BaseJob> }): Partial<BaseJob> {
  if (data.log) {
    const sanitizedData = { ...data }
    sanitizedData.log = sanitizedData?.log?.map((log) => {
      if (log.id) {
        return log
      }
      return {
        ...log,
        id: new ObjectId().toHexString(),
      }
    })
    return sanitizedData
  }

  return data
}
