import type { FieldHook } from '../../../fields/config/types.js'

import { Forbidden } from '../../../errors/Forbidden.js'
import { generateAPIKey } from '../../apiKeys/generateAPIKey.js'
import { createKeyIndex } from './createKeyIndex.js'

/** Generates and indexes an API key when an auth document first enables API-key authentication. */
export const generateKey: FieldHook = async ({
  blockData,
  collection,
  data,
  field,
  operation,
  originalDoc,
  overrideAccess,
  previousSiblingDoc,
  previousValue,
  req,
  siblingData,
  value,
}) => {
  if (
    siblingData.enableAPIKey !== true ||
    (data?.apiKey !== null && data?.apiKey !== undefined && data.apiKey !== '')
  ) {
    return value
  }

  if (
    !overrideAccess &&
    (operation === 'create' || operation === 'update') &&
    'access' in field &&
    field.access?.[operation]
  ) {
    const hasAccess = await field.access[operation]({
      id: originalDoc?.id,
      blockData,
      collection: collection!,
      data,
      doc: originalDoc,
      req,
      siblingData,
    })

    if (!hasAccess) {
      throw new Forbidden(req.t)
    }
  }

  const isFirstEnable = operation === 'update' && previousSiblingDoc?.enableAPIKey !== true

  if (operation === 'create' || (isFirstEnable && !previousValue)) {
    const key = generateAPIKey()
    siblingData.apiKeyIndex = createKeyIndex({ key, secret: req.payload.secret })
    return key
  }

  if (isFirstEnable && previousValue) {
    siblingData.apiKeyIndex = createKeyIndex({
      key: previousValue as string,
      secret: req.payload.secret,
    })
  }

  return value
}
