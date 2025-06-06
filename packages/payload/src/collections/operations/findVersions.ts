// @ts-strict-ignore
import type { PaginatedDocs } from '../../database/types.js'
import type { PayloadRequest, PopulateType, SelectType, Sort, Where } from '../../types/index.js'
import type { TypeWithVersion } from '../../versions/types.js'
import type { Collection } from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizeInternalFields } from '../../utilities/sanitizeInternalFields.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields.js'
import { getQueryDraftsSelect } from '../../versions/drafts/getQueryDraftsSelect.js'

export type Arguments = {
  collection: Collection
  depth?: number
  limit?: number
  overrideAccess?: boolean
  page?: number
  pagination?: boolean
  populate?: PopulateType
  req?: PayloadRequest
  select?: SelectType
  showHiddenFields?: boolean
  sort?: Sort
  where?: Where
}

export const findVersionsOperation = async <TData extends TypeWithVersion<TData>>(
  args: Arguments,
): Promise<PaginatedDocs<TData>> => {
  const {
    collection: { config: collectionConfig },
    depth,
    limit,
    overrideAccess,
    page,
    pagination = true,
    populate,
    select: incomingSelect,
    showHiddenFields,
    sort,
    where,
  } = args

  const req = args.req!
  const { fallbackLocale, locale, payload } = req

  try {
    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    let accessResults

    if (!overrideAccess) {
      accessResults = await executeAccess({ req }, collectionConfig.access.readVersions)
    }

    const versionFields = buildVersionCollectionFields(payload.config, collectionConfig, true)

    await validateQueryPaths({
      collectionConfig,
      overrideAccess: overrideAccess!,
      req,
      versionFields,
      where: where!,
    })

    const fullWhere = combineQueries(where!, accessResults)

    const select = sanitizeSelect({
      fields: buildVersionCollectionFields(payload.config, collectionConfig, true),
      forceSelect: getQueryDraftsSelect({ select: collectionConfig.forceSelect }),
      select: incomingSelect,
      versions: true,
    })

    // /////////////////////////////////////
    // Find
    // /////////////////////////////////////

    const paginatedDocs = await payload.db.findVersions<TData>({
      collection: collectionConfig.slug,
      limit: limit ?? 10,
      locale: locale!,
      page: page || 1,
      pagination,
      req,
      select,
      sort,
      where: fullWhere,
    })

    // /////////////////////////////////////
    // beforeRead - Collection
    // /////////////////////////////////////
    const result: PaginatedDocs<TData> = paginatedDocs as unknown as PaginatedDocs<TData>
    result.docs = (await Promise.all(
      paginatedDocs.docs.map(async (doc) => {
        const docRef = doc
        // Fallback if not selected
        if (!docRef.version) {
          ;(docRef as any).version = {}
        }

        if (collectionConfig.hooks?.beforeRead?.length) {
          for (const hook of collectionConfig.hooks.beforeRead) {
            docRef.version =
              (await hook({
                collection: collectionConfig,
                context: req.context,
                doc: docRef.version,
                query: fullWhere,
                req,
              })) || docRef.version
          }
        }

        return docRef
      }),
    )) as TData[]
    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result.docs = await Promise.all(
      result.docs.map(async (data) => {
        data.version = await afterRead({
          collection: collectionConfig,
          context: req.context,
          depth: depth!,
          doc: data.version,
          // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
          draft: undefined,
          fallbackLocale: fallbackLocale!,
          findMany: true,
          global: null,
          locale: locale!,
          overrideAccess: overrideAccess!,
          populate,
          req,
          select: typeof select?.version === 'object' ? select.version : undefined,
          showHiddenFields: showHiddenFields!,
        })
        return data
      }),
    )

    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks.afterRead?.length) {
      result.docs = await Promise.all(
        result.docs.map(async (doc) => {
          const docRef = doc

          for (const hook of collectionConfig.hooks.afterRead) {
            docRef.version =
              (await hook({
                collection: collectionConfig,
                context: req.context,
                doc: doc.version,
                findMany: true,
                query: fullWhere,
                req,
              })) || doc.version
          }

          return docRef
        }),
      )
    }

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////
    result.docs = result.docs.map((doc) => sanitizeInternalFields<TData>(doc))

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
