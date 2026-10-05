import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { JsonObject, PayloadRequest } from '../../../types/index.js'

import { type RequestContext } from '../../../index.js'
import { mergeLocalizedData } from '../../../utilities/mergeLocalizedData.js'
import { getLocaleData, wrapLocaleData } from '../../../versions/getLocaleData.js'
import { traverseFields } from './traverseFields.js'

type Args<T extends JsonObject> = {
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  data: T
  doc?: T
  docForHooks?: T
  duplicate?: boolean
  global: null | SanitizedGlobalConfig
  id?: number | string
  onFieldAccess?: (args: { accessResult: boolean; path: string }) => void
  operation: 'create' | 'update'
  overrideAccess: boolean
  req: PayloadRequest
}

/**
 * This function is responsible for the following actions, in order:
 * - Sanitize incoming data
 * - Execute field hooks
 * - Execute field access control
 * - Merge original document data into incoming data
 * - Compute default values for undefined fields
 */
export const beforeValidate = async <T extends JsonObject>({
  id,
  collection,
  context,
  data: incomingData,
  doc,
  docForHooks,
  global,
  onFieldAccess,
  operation,
  overrideAccess,
  req,
}: Args<T>): Promise<T> => {
  const { localization } = req.payload.config

  if (req.locale === 'all' && localization) {
    const fields = (collection?.fields || global?.fields)!
    let result: JsonObject = doc ? { ...doc } : {}
    let locales = localization.locales

    if (localization.filterAvailableLocales) {
      locales = await localization.filterAvailableLocales({ locales, req })
    }

    for (const localeDefinition of locales) {
      const locale = typeof localeDefinition === 'string' ? localeDefinition : localeDefinition.code
      const localeReq = Object.assign(Object.create(Object.getPrototypeOf(req)), req, {
        locale,
      }) as PayloadRequest
      const localeData = getLocaleData({ data: incomingData, fields, locale, req: localeReq })
      const localeDoc = getLocaleData({ data: doc || {}, fields, locale, req: localeReq })
      const processed = await beforeValidate({
        id,
        collection,
        context,
        data: localeData as T,
        doc: localeDoc as T,
        docForHooks: docForHooks
          ? (getLocaleData({ data: docForHooks, fields, locale, req: localeReq }) as T)
          : undefined,
        global,
        onFieldAccess,
        operation,
        overrideAccess,
        req: localeReq,
      })

      result = mergeLocalizedData({
        configBlockReferences: req.payload.config.blocks,
        dataWithLocales: wrapLocaleData({ data: processed, fields, locale, req: localeReq }),
        docWithLocales: result,
        fields,
        localesToUpdate: [locale],
      })
    }

    return result as T
  }

  await traverseFields({
    id,
    collection,
    context,
    data: incomingData,
    doc,
    docForHooks,
    fields: (collection?.fields || global?.fields)!,
    global,
    onFieldAccess,
    operation,
    overrideAccess,
    parentIndexPath: '',
    parentIsLocalized: false,
    parentPath: '',
    parentSchemaPath: '',
    req,
    siblingData: incomingData,
    siblingDoc: doc!,
  })

  return incomingData
}
