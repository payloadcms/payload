import type { DeepPartial } from 'ts-essentials'

import type { ValidationResult } from '../../collections/operations/local/validate.js'
import type { GlobalSlug, JsonObject } from '../../index.js'
import type { PayloadRequest, Where } from '../../types/index.js'
import type { DataFromGlobalSlug, SanitizedGlobalConfig } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { ValidationError } from '../../errors/index.js'
import { beforeChange } from '../../fields/hooks/beforeChange/index.js'
import { beforeValidate } from '../../fields/hooks/beforeValidate/index.js'
import { deepCopyObjectSimple } from '../../utilities/deepCopyObject.js'
import { flattenDataByLocale } from '../../utilities/flattenDataByLocale.js'
import { getLatestGlobalVersion } from '../../versions/getLatestGlobalVersion.js'

export type Arguments<TSlug extends GlobalSlug> = {
  data?: DeepPartial<Omit<DataFromGlobalSlug<TSlug>, 'id'>>
  globalConfig: SanitizedGlobalConfig
  overrideAccess: boolean
  req: PayloadRequest
  slug: string
}

export async function validateOperation<TSlug extends GlobalSlug>(
  args: Arguments<TSlug>,
): Promise<ValidationResult> {
  const previousOperation = args.req.operation
  args.req.operation = 'validate'

  try {
    return await validateOperationWithScopedRequest(args)
  } finally {
    args.req.operation = previousOperation
  }
}

async function validateOperationWithScopedRequest<TSlug extends GlobalSlug>({
  slug,
  data: incomingData,
  globalConfig,
  overrideAccess,
  req,
}: Arguments<TSlug>): Promise<ValidationResult> {
  const accessResult = !overrideAccess
    ? await executeAccess({ data: incomingData, req }, globalConfig.access.validate)
    : true
  const where: Where = overrideAccess ? undefined! : (accessResult as Where)
  const globalVersionResult = await getLatestGlobalVersion({
    slug,
    config: globalConfig,
    locale: req.locale!,
    payload: req.payload,
    req,
    where,
  })

  let docWithLocales: JsonObject = {}

  if (globalVersionResult?.global) {
    docWithLocales = deepCopyObjectSimple(globalVersionResult.global)

    if (docWithLocales._id) {
      delete docWithLocales._id
    }
  }

  const originalDoc = flattenDataByLocale({
    configBlockReferences: req.payload.config.blocks,
    docWithLocales,
    fields: globalConfig.fields,
    locale: req.locale!,
  })

  let data = flattenDataByLocale({
    configBlockReferences: req.payload.config.blocks,
    docWithLocales: deepCopyObjectSimple(incomingData ?? {}) as JsonObject,
    fields: globalConfig.fields,
    locale: req.locale!,
    localeCodes: req.payload.config.localization
      ? req.payload.config.localization.localeCodes
      : undefined,
  })

  data = await beforeValidate({
    collection: null,
    context: req.context,
    data,
    doc: originalDoc,
    global: globalConfig,
    operation: 'validate',
    overrideAccess,
    req,
  })

  if (globalConfig.hooks.beforeValidate?.length) {
    for (const hook of globalConfig.hooks.beforeValidate) {
      data =
        (await hook({
          context: req.context,
          data,
          global: globalConfig,
          operation: 'validate',
          originalDoc,
          overrideAccess,
          req,
        })) || data
    }
  }

  if (globalConfig.hooks.beforeChange?.length) {
    for (const hook of globalConfig.hooks.beforeChange) {
      data =
        (await hook({
          context: req.context,
          data,
          global: globalConfig,
          operation: 'validate',
          originalDoc,
          overrideAccess,
          req,
        })) || data
    }
  }

  try {
    await beforeChange({
      collection: null,
      context: req.context,
      data,
      doc: originalDoc,
      docWithLocales,
      global: globalConfig,
      operation: 'validate',
      overrideAccess,
      req,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        errors: error.data.errors.map((validationError) => ({
          ...validationError,
          locale: req.locale ?? undefined,
        })),
        valid: false,
      }
    }

    throw error
  }

  return {
    errors: [],
    valid: true,
  }
}
