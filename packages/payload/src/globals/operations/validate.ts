import type { DeepPartial } from 'ts-essentials'

import type { TypeWithID } from '../../collections/config/types.js'
import type { ValidationResult } from '../../collections/operations/local/validate.js'
import type { AccessResult } from '../../config/types.js'
import type { GlobalSlug, JsonObject } from '../../index.js'
import type { PayloadRequest, Where } from '../../types/index.js'
import type { DataFromGlobalSlug, SanitizedGlobalConfig } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import { Forbidden, ValidationError } from '../../errors/index.js'
import { beforeChange } from '../../fields/hooks/beforeChange/index.js'
import { beforeValidate } from '../../fields/hooks/beforeValidate/index.js'
import { deepCopyObjectSimple } from '../../utilities/deepCopyObject.js'
import { flattenDataByLocale } from '../../utilities/flattenDataByLocale.js'
import { replaceWithDraftIfAvailable } from '../../versions/drafts/replaceWithDraftIfAvailable.js'

export type Arguments<TSlug extends GlobalSlug> = {
  data?: DeepPartial<Omit<DataFromGlobalSlug<TSlug>, 'id'>>
  /**
   * Whether `data` stores each localized field as a locale-code-keyed object, as the internal
   * publish-all-locales candidate does, rather than a flat, single-locale candidate.
   * @default false
   */
  dataIsLocaleKeyed?: boolean
  draft: boolean
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
  dataIsLocaleKeyed = false,
  draft,
  globalConfig,
  overrideAccess,
  req,
}: Arguments<TSlug>): Promise<ValidationResult> {
  const accessResult = !overrideAccess
    ? await executeAccess({ slug, data: incomingData, req }, globalConfig.access.validate)
    : true
  const storedGlobal = await resolveValidationGlobalSource({
    slug,
    accessResult,
    draft,
    globalConfig,
    overrideAccess,
    req,
  })

  const docWithLocales: JsonObject = deepCopyObjectSimple(storedGlobal)

  if (docWithLocales._id) {
    delete docWithLocales._id
  }

  const originalDoc = flattenDataByLocale({
    configBlockReferences: req.payload.config.blocks,
    docWithLocales,
    fields: globalConfig.fields,
    locale: req.locale!,
  })

  let data = flattenDataByLocale({
    configBlockReferences: req.payload.config.blocks,
    dataIsLocaleKeyed,
    docWithLocales: deepCopyObjectSimple(incomingData ?? {}) as JsonObject,
    fields: globalConfig.fields,
    locale: req.locale!,
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

async function resolveValidationGlobalSource({
  slug,
  accessResult,
  draft,
  globalConfig,
  overrideAccess,
  req,
}: {
  accessResult: AccessResult
  draft: boolean
  globalConfig: SanitizedGlobalConfig
  overrideAccess: boolean
  req: PayloadRequest
  slug: string
}): Promise<JsonObject> {
  const accessWhere = overrideAccess ? undefined : (accessResult as Where)
  const accessibleMain = await req.payload.db.findGlobal({
    slug,
    locale: req.locale!,
    req,
    where: accessWhere,
  })
  const hasAccessibleMain = hasGlobalSource(accessibleMain)
  const accessibleBase = hasAccessibleMain ? accessibleMain : { globalType: slug }
  // Global version lookups are slug-scoped; the shared helper's ID constraint applies to collections.
  const accessibleSource =
    draft && globalConfig.versions?.drafts
      ? await replaceWithDraftIfAvailable({
          accessResult,
          doc: accessibleBase as JsonObject & TypeWithID,
          entity: globalConfig,
          entityType: 'global',
          overrideAccess,
          req,
        })
      : accessibleBase

  if (hasAccessibleMain || accessibleSource !== accessibleBase) {
    return accessibleSource
  }

  if (hasWhereAccessResult(accessResult)) {
    const unrestrictedMain = await req.payload.db.findGlobal({
      slug,
      locale: req.locale!,
      req,
    })
    const hasUnrestrictedMain = hasGlobalSource(unrestrictedMain)
    const unrestrictedBase = hasUnrestrictedMain ? unrestrictedMain : { globalType: slug }
    const unrestrictedSource =
      draft && globalConfig.versions?.drafts
        ? await replaceWithDraftIfAvailable({
            accessResult: true,
            doc: unrestrictedBase as JsonObject & TypeWithID,
            entity: globalConfig,
            entityType: 'global',
            overrideAccess: true,
            req,
          })
        : unrestrictedBase

    if (hasUnrestrictedMain || unrestrictedSource !== unrestrictedBase) {
      throw new Forbidden(req.t)
    }
  }

  return {}
}

function hasGlobalSource(source: JsonObject | null | undefined): source is JsonObject {
  return Boolean(source && Object.keys(source).length > 0)
}
