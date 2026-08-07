import type { DeepPartial } from 'ts-essentials'

import type { FindOneArgs } from '../../database/types.js'
import type { CollectionSlug, JsonObject } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'
import type { Collection, RequiredDataFromCollectionSlug, TypeWithID } from '../config/types.js'
import type { ValidationResult } from './local/validate.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import { combineQueries } from '../../database/combineQueries.js'
import { Forbidden, NotFound, ValidationError } from '../../errors/index.js'
import { beforeChange } from '../../fields/hooks/beforeChange/index.js'
import { beforeValidate } from '../../fields/hooks/beforeValidate/index.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { deepCopyObjectSimple } from '../../utilities/deepCopyObject.js'
import { flattenDataByLocale } from '../../utilities/flattenDataByLocale.js'
import { replaceWithDraftIfAvailable } from '../../versions/drafts/replaceWithDraftIfAvailable.js'

export type Arguments<TSlug extends CollectionSlug> = {
  collection: Collection
  data?: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>
  draft: boolean
  id?: number | string
  overrideAccess: boolean
  req: PayloadRequest
  trash?: boolean
}

export async function validateOperation<TSlug extends CollectionSlug>(
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

async function validateOperationWithScopedRequest<TSlug extends CollectionSlug>({
  id,
  collection,
  data: incomingData,
  draft,
  overrideAccess,
  req,
  trash,
}: Arguments<TSlug>): Promise<ValidationResult> {
  const collectionConfig = collection.config

  const accessResult = !overrideAccess
    ? await executeAccess({ id, data: incomingData, req }, collectionConfig.access.validate)
    : true
  const hasWherePolicy = hasWhereAccessResult(accessResult)

  let docWithLocales: JsonObject = {}

  if (id !== undefined) {
    const where = appendNonTrashedFilter({
      enableTrash: collectionConfig.trash,
      trash: Boolean(trash),
      where: combineQueries({ id: { equals: id } }, accessResult),
    })
    const query: FindOneArgs = {
      collection: collectionConfig.slug,
      locale: req.locale!,
      req,
      where,
    }

    let storedDocument = await req.payload.db.findOne<
      RequiredDataFromCollectionSlug<TSlug> & TypeWithID
    >({ ...query, req })

    if (!storedDocument && hasWherePolicy) {
      throw new Forbidden(req.t)
    }
    if (!storedDocument) {
      throw new NotFound(req.t)
    }

    if (draft && collectionConfig.versions?.drafts) {
      storedDocument = await replaceWithDraftIfAvailable({
        accessResult,
        doc: storedDocument,
        entity: collectionConfig,
        entityType: 'collection',
        overrideAccess,
        req,
      })
    }

    docWithLocales = deepCopyObjectSimple(storedDocument)
  }

  const originalDoc = flattenDataByLocale({
    configBlockReferences: req.payload.config.blocks,
    docWithLocales,
    fields: collectionConfig.fields,
    locale: req.locale!,
  })

  let data = flattenDataByLocale({
    configBlockReferences: req.payload.config.blocks,
    docWithLocales: deepCopyObjectSimple(incomingData ?? {}) as JsonObject,
    fields: collectionConfig.fields,
    locale: req.locale!,
    localeCodes: req.payload.config.localization
      ? req.payload.config.localization.localeCodes
      : undefined,
  })

  data = await beforeValidate({
    id,
    collection: collectionConfig,
    context: req.context,
    data,
    doc: originalDoc,
    global: null,
    operation: 'validate',
    overrideAccess,
    req,
  })

  if (collectionConfig.hooks.beforeValidate?.length) {
    for (const hook of collectionConfig.hooks.beforeValidate) {
      data =
        (await hook({
          collection: collectionConfig,
          context: req.context,
          data,
          operation: 'validate',
          originalDoc,
          req,
        })) || data
    }
  }

  if (collectionConfig.hooks.beforeChange?.length) {
    for (const hook of collectionConfig.hooks.beforeChange) {
      data =
        (await hook({
          collection: collectionConfig,
          context: req.context,
          data,
          operation: 'validate',
          originalDoc,
          req,
        })) || data
    }
  }

  try {
    await beforeChange({
      id,
      collection: collectionConfig,
      context: req.context,
      data: id === undefined ? data : { ...data, id },
      doc: originalDoc,
      docWithLocales,
      global: null,
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
