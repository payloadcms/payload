import type { DeepPartial } from 'ts-essentials'

import type { TypeWithID } from '../../collections/config/types.js'
import type { AccessResult } from '../../config/types.js'
import type { GlobalSlug, JsonObject } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'
import type { ValidationResult } from '../../types/validation.js'
import type { DataFromGlobalSlug, SanitizedGlobalConfig } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import { Forbidden } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { deepCopyObjectSimple } from '../../utilities/deepCopyObject.js'
import { runValidationLifecycle } from '../../utilities/runValidationLifecycle.js'
import {
  findDraftVersion,
  getDocumentFromDraftVersion,
} from '../../versions/drafts/replaceWithDraftIfAvailable.js'

export type Arguments<TSlug extends GlobalSlug> = {
  data?: DeepPartial<Omit<DataFromGlobalSlug<TSlug>, 'id'>>
  draft: boolean
  globalConfig: SanitizedGlobalConfig
  onValidationData?: (data: JsonObject) => void
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
  draft,
  globalConfig,
  onValidationData,
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

  const originalDoc = await afterRead({
    collection: null,
    context: req.context,
    depth: 0,
    doc: deepCopyObjectSimple(docWithLocales),
    draft,
    fallbackLocale: req.fallbackLocale!,
    global: globalConfig,
    locale: req.locale!,
    overrideAccess: true,
    req,
    showHiddenFields: true,
  })

  return runValidationLifecycle({
    collection: null,
    docWithLocales,
    global: globalConfig,
    incomingData: incomingData as JsonObject | undefined,
    onValidationData,
    originalDoc,
    overrideAccess,
    req,
  })
}

/**
 * Selects the newest stored source before it applies a `where` access policy. This prevents an
 * older accessible draft from replacing a newer restricted draft. If no draft exists, the main
 * global remains the validation source.
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
  const main = await req.payload.db.findGlobal({
    slug,
    locale: req.locale!,
    req,
  })
  const hasMain = hasGlobalSource(main)
  const base = (hasMain ? main : { globalType: slug }) as JsonObject & TypeWithID

  if (draft && globalConfig.versions?.drafts) {
    const newestDraft = await findDraftVersion({
      accessResult: true,
      doc: base,
      entity: globalConfig,
      entityType: 'global',
      overrideAccess: true,
      req,
    })

    if (newestDraft) {
      if (hasWhereAccessResult(accessResult)) {
        const accessibleDraft = await findDraftVersion({
          accessResult,
          doc: base,
          draftVersionID: newestDraft.id,
          entity: globalConfig,
          entityType: 'global',
          overrideAccess,
          req,
        })

        if (!accessibleDraft) {
          throw new Forbidden(req.t)
        }
      }

      return getDocumentFromDraftVersion({
        doc: base,
        draftVersion: newestDraft,
        entityType: 'global',
      })
    }
  }

  if (!hasMain) {
    return {}
  }

  if (!hasWhereAccessResult(accessResult)) {
    return main
  }

  const accessibleMain = await req.payload.db.findGlobal({
    slug,
    locale: req.locale!,
    req,
    where: accessResult,
  })

  if (!hasGlobalSource(accessibleMain)) {
    throw new Forbidden(req.t)
  }

  return accessibleMain
}

function hasGlobalSource(source: JsonObject | null | undefined): source is JsonObject {
  return Boolean(source && Object.keys(source).length > 0)
}
