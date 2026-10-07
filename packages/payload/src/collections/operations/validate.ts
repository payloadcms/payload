import type { DeepPartial } from 'ts-essentials'

import type { FindOneArgs } from '../../database/types.js'
import type { CollectionSlug, JsonObject } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'
import type { ValidationResult } from '../../types/validation.js'
import type { Collection, RequiredDataFromCollectionSlug, TypeWithID } from '../config/types.js'

import { ensureUsernameOrEmail } from '../../auth/ensureUsernameOrEmail.js'
import { executeAccess } from '../../auth/executeAccess.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import { combineQueries } from '../../database/combineQueries.js'
import { Forbidden, NotFound } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { deepCopyObjectSimple } from '../../utilities/deepCopyObject.js'
import { runValidationLifecycle } from '../../utilities/runValidationLifecycle.js'
import { appendVersionToQueryKey } from '../../versions/drafts/appendVersionToQueryKey.js'
import { validateUniqueConstraints } from './utilities/validateUniqueConstraints.js'

export type Arguments<TSlug extends CollectionSlug> = {
  collection: Collection
  data?: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>
  draft: boolean
  id?: number | string
  onValidationData?: (data: JsonObject) => void
  overrideAccess: boolean
  req: PayloadRequest
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
  onValidationData,
  overrideAccess,
  req,
}: Arguments<TSlug>): Promise<ValidationResult> {
  const collectionConfig = collection.config

  const accessResult = !overrideAccess
    ? await executeAccess(
        { id, slug: collectionConfig.slug, data: incomingData, req },
        collectionConfig.access.validate,
      )
    : true
  const hasWherePolicy = hasWhereAccessResult(accessResult)

  if (id === undefined && hasWherePolicy) {
    throw new Forbidden(req.t)
  }

  let docWithLocales: JsonObject = {}

  if (id !== undefined) {
    const idWhere = appendNonTrashedFilter({
      enableTrash: collectionConfig.trash,
      trash: false,
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

  const originalDoc =
    id === undefined
      ? docWithLocales
      : await afterRead({
          collection: collectionConfig,
          context: req.context,
          depth: 0,
          doc: deepCopyObjectSimple(docWithLocales),
          draft,
          fallbackLocale: null,
          global: null,
          locale: req.locale!,
          overrideAccess: true,
          req,
          showHiddenFields: true,
        })

  return runValidationLifecycle({
    id,
    beforeValidation: ({ data }) => {
      if (!collectionConfig.auth) {
        return
      }

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
    },
    collection: collectionConfig,
    docWithLocales,
    global: null,
    incomingData: incomingData as JsonObject | undefined,
    onValidationData,
    originalDoc,
    overrideAccess,
    req,
    validateData: ({ data }) =>
      validateUniqueConstraints({
        id,
        collection: collectionConfig,
        data,
        req,
      }),
  })
}
