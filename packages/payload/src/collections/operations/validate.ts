import type { DeepPartial } from 'ts-essentials'

import type { FindOneArgs } from '../../database/types.js'
import type { CollectionSlug, JsonObject } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'
import type { Collection, RequiredDataFromCollectionSlug, TypeWithID } from '../config/types.js'
import type { ValidationResult } from './local/validate.js'

import { ensureUsernameOrEmail } from '../../auth/ensureUsernameOrEmail.js'
import { executeAccess } from '../../auth/executeAccess.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import { combineQueries } from '../../database/combineQueries.js'
import { Forbidden, NotFound } from '../../errors/index.js'
import { beforeChange } from '../../fields/hooks/beforeChange/index.js'
import { beforeValidate } from '../../fields/hooks/beforeValidate/index.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { deepCopyObjectSimple } from '../../utilities/deepCopyObject.js'
import { deepMergeWithSourceArraysIgnoringUndefined } from '../../utilities/deepMerge.js'
import { flattenDataByLocale } from '../../utilities/flattenDataByLocale.js'
import { toValidationResult } from '../../utilities/toValidationResult.js'
import { appendVersionToQueryKey } from '../../versions/drafts/appendVersionToQueryKey.js'

export type Arguments<TSlug extends CollectionSlug> = {
  collection: Collection
  data?: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>
  /**
   * Whether `data` stores each localized field as a locale-code-keyed object, as the internal
   * publish-all-locales candidate does, rather than a flat, single-locale candidate.
   * @default false
   */
  dataIsLocaleKeyed?: boolean
  draft: boolean
  id?: number | string
  onValidationData?: (data: JsonObject) => void
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
  dataIsLocaleKeyed = false,
  draft,
  onValidationData,
  overrideAccess,
  req,
  trash,
}: Arguments<TSlug>): Promise<ValidationResult> {
  const collectionConfig = collection.config

  const accessResult = !overrideAccess
    ? await executeAccess(
        { id, slug: collectionConfig.slug, data: incomingData, req },
        collectionConfig.access.validate,
      )
    : true
  const hasWherePolicy = hasWhereAccessResult(accessResult)

  let docWithLocales: JsonObject = {}

  if (id !== undefined) {
    const idWhere = appendNonTrashedFilter({
      enableTrash: collectionConfig.trash,
      trash: Boolean(trash),
      where: { id: { equals: id } },
    })
    const where = combineQueries(idWhere, accessResult)
    const query: FindOneArgs = {
      collection: collectionConfig.slug,
      locale: req.locale!,
      req,
      where,
    }

    let storedDocument: (RequiredDataFromCollectionSlug<TSlug> & TypeWithID) | undefined

    if (draft && collectionConfig.versions?.drafts) {
      const { docs } = await req.payload.db.queryDrafts<
        RequiredDataFromCollectionSlug<TSlug> & TypeWithID
      >({
        collection: collectionConfig.slug,
        limit: 1,
        locale: req.locale!,
        pagination: false,
        req,
        where: appendVersionToQueryKey(where),
      })

      storedDocument = docs[0]

      if (!storedDocument && hasWherePolicy) {
        const { docs: existingVersions } = await req.payload.db.queryDrafts({
          collection: collectionConfig.slug,
          limit: 1,
          locale: req.locale!,
          pagination: false,
          req,
          select: { parent: true },
          where: appendVersionToQueryKey(idWhere),
        })

        if (existingVersions[0]) {
          throw new Forbidden(req.t)
        }
      }
    }

    if (!storedDocument) {
      storedDocument =
        (await req.payload.db.findOne<RequiredDataFromCollectionSlug<TSlug> & TypeWithID>({
          ...query,
          req,
        })) ?? undefined
    }

    if (!storedDocument && hasWherePolicy) {
      throw new Forbidden(req.t)
    }
    if (!storedDocument) {
      throw new NotFound(req.t)
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
    dataIsLocaleKeyed,
    docWithLocales: deepCopyObjectSimple(incomingData ?? {}) as JsonObject,
    fields: collectionConfig.fields,
    locale: req.locale!,
  })

  try {
    onValidationData?.(deepMergeWithSourceArraysIgnoringUndefined<JsonObject>(originalDoc, data))

    if (collectionConfig.auth) {
      if (id === undefined) {
        ensureUsernameOrEmail<TSlug>({
          authOptions: collectionConfig.auth,
          collectionSlug: collectionConfig.slug,
          data: data as RequiredDataFromCollectionSlug<TSlug>,
          operation: 'create',
          req,
        })
      } else {
        ensureUsernameOrEmail<TSlug>({
          authOptions: collectionConfig.auth,
          collectionSlug: collectionConfig.slug,
          data: data as RequiredDataFromCollectionSlug<TSlug>,
          operation: 'update',
          originalDoc: originalDoc as RequiredDataFromCollectionSlug<TSlug>,
          req,
        })
      }
    }

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
    onValidationData?.(data)

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
    return toValidationResult({ error, req })
  }

  return {
    errors: [],
    valid: true,
  }
}
