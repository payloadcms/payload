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
  /**
   * Data of the nearest parent block. If no parent block exists, this will be the `undefined`
   */
  blockData?: JsonObject
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
  parentIndexPath: string
  /**
   * @todo make required in v4.0
   */
  parentIsLocalized?: boolean
  parentPath: string
  parentSchemaPath: string
  populate?: PopulateType
  populationPromises: Promise<void>[]
  req: PayloadRequest
  select?: SelectType
  selectMode?: SelectMode
  showHiddenFields: boolean
  siblingDoc: JsonObject
  triggerAccessControl?: boolean
  triggerHooks?: boolean
}

export const traverseFields = ({
  blockData,
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
  parentIndexPath,
  parentIsLocalized,
  parentPath,
  parentSchemaPath,
  populate,
  populationPromises,
  req,
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
        blockData,
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
        parentIndexPath,
        parentIsLocalized,
        parentPath,
        parentSchemaPath,
        populate,
        populationPromises,
        req,
        select,
        selectMode,
        showHiddenFields,
        siblingDoc,
        siblingFields: fields,
        triggerAccessControl,
        triggerHooks,
      }),
    )
  })
}
