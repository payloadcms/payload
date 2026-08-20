import type { DeepPartial } from 'ts-essentials'

import type { TypeWithID } from '../../collections/config/types.js'
import type { ValidationResult } from '../../collections/operations/local/validate.js'
import type { AccessResult } from '../../config/types.js'
import type { GlobalSlug, JsonObject } from '../../index.js'
import type { PayloadRequest, Where } from '../../types/index.js'
import type { DataFromGlobalSlug, SanitizedGlobalConfig } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import { Forbidden } from '../../errors/index.js'
import { beforeChange } from '../../fields/hooks/beforeChange/index.js'
import { beforeValidate } from '../../fields/hooks/beforeValidate/index.js'
import { deepCopyObjectSimple } from '../../utilities/deepCopyObject.js'
import { flattenDataByLocale } from '../../utilities/flattenDataByLocale.js'
import { toValidationResult } from '../../utilities/toValidationResult.js'
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

  try {
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
    return toValidationResult({ error, req })
  }

  return {
    errors: [],
    valid: true,
  }
}

/**
 * Loads the global through `where`, then substitutes the newest available draft when requested.
 * Reports whether a main document existed so the caller can tell "no document yet" apart from
 * "a document exists but this candidate wasn't derived from it" once a draft substitution runs.
 */
async function loadValidationGlobalCandidate({
  slug,
  accessResult,
  draft,
  globalConfig,
  overrideAccess,
  req,
  where,
}: {
  accessResult: AccessResult
  draft: boolean
  globalConfig: SanitizedGlobalConfig
  overrideAccess: boolean
  req: PayloadRequest
  slug: string
  where: undefined | Where
}): Promise<{ base: JsonObject; hasMain: boolean; source: JsonObject }> {
  const main = await req.payload.db.findGlobal({
    slug,
    locale: req.locale!,
    req,
    where,
  })
  const hasMain = hasGlobalSource(main)
  const base = hasMain ? main : { globalType: slug }
  // Global version lookups are slug-scoped; the shared helper's ID constraint applies to collections.
  const source =
    draft && globalConfig.versions?.drafts
      ? await replaceWithDraftIfAvailable({
          accessResult,
          doc: base as JsonObject & TypeWithID,
          entity: globalConfig,
          entityType: 'global',
          overrideAccess,
          req,
        })
      : base

  return { base, hasMain, source }
}

/**
 * Deliberately more revealing than `findOne`/`update`, which treat an access-restricted global
 * the same as an unconfigured one and stay silent. Validation instead throws `Forbidden` once it
 * confirms real data exists behind the `where` policy - otherwise a restricted, already-configured
 * global would validate the candidate against an empty base, as if it were still unset.
 */
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
  const accessible = await loadValidationGlobalCandidate({
    slug,
    accessResult,
    draft,
    globalConfig,
    overrideAccess,
    req,
    where: overrideAccess ? undefined : (accessResult as Where),
  })

  if (accessible.hasMain || accessible.source !== accessible.base) {
    return accessible.source
  }

  if (hasWhereAccessResult(accessResult)) {
    const unrestricted = await loadValidationGlobalCandidate({
      slug,
      accessResult: true,
      draft,
      globalConfig,
      overrideAccess: true,
      req,
      where: undefined,
    })

    if (unrestricted.hasMain || unrestricted.source !== unrestricted.base) {
      throw new Forbidden(req.t)
    }
  }

  return {}
}

function hasGlobalSource(source: JsonObject | null | undefined): source is JsonObject {
  return Boolean(source && Object.keys(source).length > 0)
}
