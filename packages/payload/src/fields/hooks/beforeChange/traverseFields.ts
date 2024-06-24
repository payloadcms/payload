import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { Operation, PayloadRequestWithData, RequestContext } from '../../../types/index.js'
import type { Field, TabAsField } from '../../config/types.js'

import { promise } from './promise.js'

type Args = {
  collection: SanitizedCollectionConfig | null
  context: RequestContext
  data: Record<string, unknown>
  /**
   * The original data (not modified by any hooks)
   */
  doc: Record<string, unknown>
  /**
   * The original data with locales (not modified by any hooks)
   */
  docWithLocales: Record<string, unknown>
  duplicate: boolean
  errors: { field: string; message: string }[]
  fields: (Field | TabAsField)[]
  global: SanitizedGlobalConfig | null
  id?: number | string
  mergeLocaleActions: (() => Promise<void>)[]
  operation: Operation
  path: string
  req: PayloadRequestWithData
  siblingData: Record<string, unknown>
  /**
   * The original siblingData (not modified by any hooks)
   */
  siblingDoc: Record<string, unknown>
  /**
   * The original siblingData with locales (not modified by any hooks)
   */
  siblingDocWithLocales: Record<string, unknown>
  skipValidation?: boolean
}

/**
 * This function is responsible for the following actions, in order:
 * - Run condition
 * - Execute field hooks
 * - Validate data
 * - Transform data for storage
 * - Unflatten locales
 */
export const traverseFields = async ({
  id,
  collection,
  context,
  data,
  doc,
  docWithLocales,
  duplicate,
  errors,
  fields,
  global,
  mergeLocaleActions,
  operation,
  path,
  req,
  siblingData,
  siblingDoc,
  siblingDocWithLocales,
  skipValidation,
}: Args): Promise<void> => {
  const promises = []

  fields.forEach((field) => {
    promises.push(
      promise({
        id,
        collection,
        context,
        data,
        doc,
        docWithLocales,
        duplicate,
        errors,
        field,
        global,
        mergeLocaleActions,
        operation,
        path,
        req,
        siblingData,
        siblingDoc,
        siblingDocWithLocales,
        skipValidation,
      }),
    )
  })

  await Promise.all(promises)
}
