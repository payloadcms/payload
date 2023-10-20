import type { PaginatedDocs } from '../../database/types'
import type { PayloadRequest } from '../../express/types'
import type { Where } from '../../types'
import type { TypeWithVersion } from '../../versions/types'
import type { Collection } from '../config/types'

import executeAccess from '../../auth/executeAccess'
import { combineQueries } from '../../database/combineQueries'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths'
import { afterRead } from '../../fields/hooks/afterRead'
import { commitTransaction } from '../../utilities/commitTransaction'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields'
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields'

export type Arguments = {
  collection: Collection
  depth?: number
  limit?: number
  overrideAccess?: boolean
  page?: number
  req?: PayloadRequest
  showHiddenFields?: boolean
  sort?: string
  where?: Where
}

async function findVersions<T extends TypeWithVersion<T>>(
  args: Arguments,
): Promise<PaginatedDocs<T>> {
  const {
    collection: { config: collectionConfig },
    depth,
    limit,
    overrideAccess,
    page,
    req: { locale, payload },
    req,
    showHiddenFields,
    sort,
    where,
  } = args

  try {
    const shouldCommit = await initTransaction(req)

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    let accessResults

    if (!overrideAccess) {
      accessResults = await executeAccess({ req }, collectionConfig.access.readVersions)
    }

    const versionFields = buildVersionCollectionFields(collectionConfig)

    await validateQueryPaths({
      collectionConfig,
      overrideAccess,
      req,
      versionFields,
      where,
    })

    const fullWhere = combineQueries(where, accessResults)

    // /////////////////////////////////////
    // Find
    // /////////////////////////////////////

    const paginatedDocs = await payload.db.findVersions<T>({
      collection: collectionConfig.slug,
      limit: limit ?? 10,
      locale,
      page: page || 1,
      req,
      sort,
      where: fullWhere,
    })

    // /////////////////////////////////////
    // beforeRead - Collection
    // /////////////////////////////////////

    let result = {
      ...paginatedDocs,
      docs: await Promise.all(
        paginatedDocs.docs.map(async (doc) => {
          const docRef = doc
          await collectionConfig.hooks.beforeRead.reduce(async (priorHook, hook) => {
            await priorHook

            docRef.version =
              (await hook({
                context: req.context,
                doc: docRef.version,
                query: fullWhere,
                req,
              })) || docRef.version
          }, Promise.resolve())

          return docRef
        }),
      ),
    } as PaginatedDocs<T>

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result = {
      ...result,
      docs: await Promise.all(
        result.docs.map(async (data) => ({
          ...data,
          version: await afterRead({
            context: req.context,
            depth,
            doc: data.version,
            entityConfig: collectionConfig,
            findMany: true,
            overrideAccess,
            req,
            showHiddenFields,
          }),
        })),
      ),
    }

    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////

    result = {
      ...result,
      docs: await Promise.all(
        result.docs.map(async (doc) => {
          const docRef = doc

          await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
            await priorHook

            docRef.version =
              (await hook({
                context: req.context,
                doc: doc.version,
                findMany: true,
                query: fullWhere,
                req,
              })) || doc.version
          }, Promise.resolve())

          return docRef
        }),
      ),
    }

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    result = {
      ...result,
      docs: result.docs.map((doc) => sanitizeInternalFields<T>(doc)),
    }

    if (shouldCommit) await commitTransaction(req)

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

export default findVersions
