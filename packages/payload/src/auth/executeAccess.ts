import type { Access, AccessResult } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { Forbidden } from '../errors/index.js'

type OperationArgs = {
  data?: any
  disableErrors?: boolean
  id?: number | string
  isReadingStaticFile?: boolean
  operation?: 'create' | 'delete' | 'read' | 'update'
  req: PayloadRequest
}
const executeAccess = async (
  { id, data, disableErrors, isReadingStaticFile = false, operation, req }: OperationArgs,
  access: Access,
): Promise<AccessResult> => {
  const localizationConfig = req?.payload?.config?.localization
  const localeConfig =
    localizationConfig && localizationConfig.locales.find((locale) => locale.code === req.locale)
  const localeAccess = localeConfig?.access && localeConfig.access[operation]

  if (localeAccess) {
    const result = await localeAccess({
      id,
      data,
      isReadingStaticFile,
      req,
    })

    if (!result) {
      if (!disableErrors) {
        throw new Forbidden(req.t)
      }
    }

    return result
  }

  if (access) {
    const result = await access({
      id,
      data,
      isReadingStaticFile,
      req,
    })

    if (!result) {
      if (!disableErrors) {
        throw new Forbidden(req.t)
      }
    }

    return result
  }

  if (req.user) {
    return true
  }

  if (!disableErrors) {
    throw new Forbidden(req.t)
  }
  return false
}

export default executeAccess
