import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { RequestContext } from '../../../index.js'
import type {
  JsonObject,
  PayloadRequest,
  PopulateType,
  SelectMode,
  SelectType,
} from '../../../types/index.js'
import type { Field, TabAsField } from '../../config/types.js'

import { promise } from './promise.js'

type Args = {
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  currentDepth: number
  depth: number
  doc: JsonObject
  draft: boolean
  fallbackLocale: null | string
  /**
   * fieldPromises are used for things like field hooks. They should be awaited before awaiting populationPromises
   */
  fieldPromises: Promise<void>[]
  fields: (Field | TabAsField)[]
  findMany: boolean
  flattenLocales: boolean
  global: null | SanitizedGlobalConfig
  locale: null | string
  overrideAccess: boolean
  path: (number | string)[]
  populate?: PopulateType
  populationPromises: Promise<void>[]
  req: PayloadRequest
  schemaPath: string[]
  select?: SelectType
  selectMode?: SelectMode
  showHiddenFields: boolean
  siblingDoc: JsonObject
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
  fieldPromises,
  fields,
  findMany,
  flattenLocales,
  global,
  locale,
  overrideAccess,
  path,
  populate,
  populationPromises,
  req,
  schemaPath,
  select,
  selectMode,
  showHiddenFields,
  siblingDoc,
  triggerAccessControl = true,
  triggerHooks = true,
}: Args): void => {
  fields.forEach((field, fieldIndex) => {
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
        fieldIndex,
        fieldPromises,
        findMany,
        flattenLocales,
        global,
        locale,
        overrideAccess,
        parentPath: path,
        parentSchemaPath: schemaPath,
        populate,
        populationPromises,
        req,
        select,
        selectMode,
        showHiddenFields,
        siblingDoc,
        triggerAccessControl,
        triggerHooks,
      }),
    )
  })
}
