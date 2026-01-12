import type { PaginatedDocs } from '../../database/types.js'
import type { PayloadRequest, PopulateType, SelectType, Sort, Where } from '../../types/index.js'
import type { TypeWithVersion } from '../../versions/types.js'
import type { SanitizedGlobalConfig } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizeInternalFields } from '../../utilities/sanitizeInternalFields.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { buildVersionGlobalFields } from '../../versions/buildGlobalFields.js'
import { getQueryDraftsSelect } from '../../versions/drafts/getQueryDraftsSelect.js'

export type Arguments = {
  depth?: number
  globalConfig: SanitizedGlobalConfig
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

export const findVersionsOperation = async <T extends TypeWithVersion<T>>(
  args: Arguments,
): Promise<PaginatedDocs<T>> => {
  const {
    depth,
    globalConfig,
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

  const versionFields = buildVersionGlobalFields(payload.config, globalConfig, true)

  try {
    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    const accessResults = !overrideAccess
      ? await executeAccess({ req }, globalConfig.access.readVersions)
      : true

    await validateQueryPaths({
      globalConfig,
      overrideAccess: overrideAccess!,
      req,
      versionFields,
      where: where!,
    })

    const fullWhere = combineQueries(where!, accessResults)

    const select = sanitizeSelect({
      fields: buildVersionGlobalFields(payload.config, globalConfig, true),
      forceSelect: getQueryDraftsSelect({ select: globalConfig.forceSelect }),
      select: incomingSelect,
      versions: true,
    })

    // /////////////////////////////////////
    // Find
    // /////////////////////////////////////

    const usePagination = pagination && limit !== 0
    const sanitizedLimit = limit ?? (usePagination ? 10 : 0)
    const sanitizedPage = page || 1

    const paginatedDocs = await payload.db.findGlobalVersions<T>({
      global: globalConfig.slug,
      limit: sanitizedLimit,
      locale: locale!,
      page: sanitizedPage,
      pagination,
      req,
      select,
      sort,
      where: fullWhere,
    })

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    let result = {
      ...paginatedDocs,
      docs: await Promise.all(
        paginatedDocs.docs.map(async (data) => {
          if (!data.version) {
            // Fallback if not selected
            ;(data as any).version = {}
          }
          return {
            ...data,
            version: await afterRead<T>({
              collection: null,
              context: req.context,
              depth: depth!,
              doc: {
                ...data.version,
                // Patch globalType onto version doc
                globalType: globalConfig.slug,
              },
              draft: undefined!,
              fallbackLocale: fallbackLocale!,
              findMany: true,
              global: globalConfig,
              locale: locale!,
              overrideAccess: overrideAccess!,
              populate,
              req,
              select,
              showHiddenFields: showHiddenFields!,
            }),
          }
        }),
      ),
    } as PaginatedDocs<T>

    // /////////////////////////////////////
    // afterRead - Global
    // /////////////////////////////////////

    if (globalConfig.hooks?.afterRead?.length) {
      result.docs = await Promise.all(
        result.docs.map(async (doc) => {
          const docRef = doc

          for (const hook of globalConfig.hooks.afterRead) {
            docRef.version =
              (await hook({
                context: req.context,
                doc: doc.version,
                findMany: true,
                global: globalConfig,
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

    result = {
      ...result,
      docs: result.docs.map((doc) => sanitizeInternalFields<T>(doc)),
    }

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
