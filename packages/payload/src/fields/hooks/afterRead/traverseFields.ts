import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type {
  PayloadRequestWithData,
  Populate,
  RequestContext,
  Select,
} from '../../../types/index.js'
import type { Field, TabAsField } from '../../config/types.js'

import { promise } from './promise.js'

type Args = {
  collection: SanitizedCollectionConfig | null
  context: RequestContext
  currentDepth: number
  depth: number
  doc: Record<string, unknown>
  draft: boolean
  fallbackLocale: null | string
  fieldPath?: string
  fieldPopulatePath?: string
  /**
   * fieldPromises are used for things like field hooks. They should be awaited before awaiting populationPromises
   */
  fieldPromises: Promise<void>[]
  fields: (Field | TabAsField)[]
  findMany: boolean
  flattenLocales: boolean
  global: SanitizedGlobalConfig | null
  locale: null | string
  overrideAccess: boolean
  populateArg?: Populate
  populationPromises: Promise<void>[]
  req: PayloadRequestWithData
  select?: Select
  showHiddenFields: boolean
  siblingDoc: Record<string, unknown>
  triggerAccessControl?: boolean
  triggerHooks?: boolean
}

export const traverseFields = ({
  collection,
  context,
  currentDepth,
  depth,
  doc,
  draft,
  fallbackLocale,
  fieldPath = '',
  fieldPopulatePath = '',
  fieldPromises,
  fields,
  findMany,
  flattenLocales,
  global,
  locale,
  overrideAccess,
  populateArg,
  populationPromises,
  req,
  select,
  showHiddenFields,
  siblingDoc,
  triggerAccessControl = true,
  triggerHooks = true,
}: Args): void => {
  fields.forEach((field) => {
    fieldPromises.push(
      promise({
        collection,
        context,
        currentDepth,
        depth,
        doc,
        draft,
        fallbackLocale,
        field,
        fieldPath,
        fieldPopulatePath,
        fieldPromises,
        findMany,
        flattenLocales,
        global,
        locale,
        overrideAccess,
        populateArg,
        populationPromises,
        req,
        select,
        showHiddenFields,
        siblingDoc,
        triggerAccessControl,
        triggerHooks,
      }),
    )
  })
}
