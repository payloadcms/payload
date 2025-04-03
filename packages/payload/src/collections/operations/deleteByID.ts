// @ts-strict-ignore
import type { CollectionSlug } from '../../index.js'
import type {
  PayloadRequest,
  PopulateType,
  SelectType,
  TransformCollectionWithSelect,
} from '../../types/index.js'
import type { BeforeOperationHook, Collection, DataFromCollectionSlug } from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import { combineQueries } from '../../database/combineQueries.js'
import { Forbidden, NotFound } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { deleteUserPreferences } from '../../preferences/deleteUserPreferences.js'
import { deleteAssociatedFiles } from '../../uploads/deleteAssociatedFiles.js'
import { checkDocumentLockStatus } from '../../utilities/checkDocumentLockStatus.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { deleteCollectionVersions } from '../../versions/deleteCollectionVersions.js'
import { deleteScheduledPublishJobs } from '../../versions/deleteScheduledPublishJobs.js'
import { buildAfterOperation } from './utils.js'

export type Arguments = {
  collection: Collection
  depth?: number
  disableTransaction?: boolean
  id: number | string
  overrideAccess?: boolean
  overrideLock?: boolean
  populate?: PopulateType
  req: PayloadRequest
  select?: SelectType
  showHiddenFields?: boolean
}

export const deleteByIDOperation = async <TSlug extends CollectionSlug, TSelect extends SelectType>(
  incomingArgs: Arguments,
): Promise<TransformCollectionWithSelect<TSlug, TSelect>> => {
  let args = incomingArgs

  try {
    const shouldCommit = !args.disableTransaction && (await initTransaction(args.req))

    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    if (args.collection.config.hooks?.beforeOperation?.length) {
      for (const hook of args.collection.config.hooks.beforeOperation) {
        args =
          (await hook({
            args,
            collection: args.collection.config,
            context: args.req.context,
            operation: 'delete',
            req: args.req,
          })) || args
      }
    }

    const {
      id,
      collection: { config: collectionConfig },
      depth,
      overrideAccess,
      overrideLock,
      populate,
      req: {
        fallbackLocale,
        locale,
        payload: { config },
        payload,
      },
      req,
      select: incomingSelect,
      showHiddenFields,
    } = args

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    const accessResults = !overrideAccess
      ? await executeAccess({ id, req }, collectionConfig.access.delete)
      : true
    const hasWhereAccess = hasWhereAccessResult(accessResults)

    // /////////////////////////////////////
    // beforeDelete - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.beforeDelete?.length) {
      for (const hook of collectionConfig.hooks.beforeDelete) {
        await hook({
          id,
          collection: collectionConfig,
          context: req.context,
          req,
        })
      }
    }

    // /////////////////////////////////////
    // Retrieve document
    // /////////////////////////////////////

    const docToDelete = await req.payload.db.findOne({
      collection: collectionConfig.slug,
      locale: req.locale,
      req,
      where: combineQueries({ id: { equals: id } }, accessResults),
    })

    if (!docToDelete && !hasWhereAccess) {
      throw new NotFound(req.t)
    }
    if (!docToDelete && hasWhereAccess) {
      throw new Forbidden(req.t)
    }

    // /////////////////////////////////////
    // Handle potentially locked documents
    // /////////////////////////////////////

    await checkDocumentLockStatus({
      id,
      collectionSlug: collectionConfig.slug,
      lockErrorMessage: `Document with ID ${id} is currently locked and cannot be deleted.`,
      overrideLock,
      req,
    })

    await deleteAssociatedFiles({
      collectionConfig,
      config,
      doc: docToDelete,
      overrideDelete: true,
      req,
    })

    // /////////////////////////////////////
    // Delete versions
    // /////////////////////////////////////

    if (collectionConfig.versions) {
      await deleteCollectionVersions({
        id,
        slug: collectionConfig.slug,
        payload,
        req,
      })
    }

    // /////////////////////////////////////
    // Delete scheduled posts
    // /////////////////////////////////////
    if (collectionConfig.versions?.drafts && collectionConfig.versions.drafts.schedulePublish) {
      await deleteScheduledPublishJobs({
        id,
        slug: collectionConfig.slug,
        payload,
        req,
      })
    }

    const select = sanitizeSelect({
      forceSelect: collectionConfig.forceSelect,
      select: incomingSelect,
    })

    // /////////////////////////////////////
    // Delete document
    // /////////////////////////////////////

    let result: DataFromCollectionSlug<TSlug> = await req.payload.db.deleteOne({
      collection: collectionConfig.slug,
      req,
      select,
      where: { id: { equals: id } },
    })

    // /////////////////////////////////////
    // Delete Preferences
    // /////////////////////////////////////

    await deleteUserPreferences({
      collectionConfig,
      ids: [id],
      payload,
      req,
    })

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result = await afterRead({
      collection: collectionConfig,
      context: req.context,
      depth,
      doc: result,
      draft: undefined,
      fallbackLocale,
      global: null,
      locale,
      overrideAccess,
      populate,
      req,
      select,
      showHiddenFields,
    })

    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.afterRead?.length) {
      for (const hook of collectionConfig.hooks.afterRead) {
        result =
          (await hook({
            collection: collectionConfig,
            context: req.context,
            doc: result,
            req,
          })) || result
      }
    }

    // /////////////////////////////////////
    // afterDelete - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.afterDelete?.length) {
      for (const hook of collectionConfig.hooks.afterDelete) {
        result =
          (await hook({
            id,
            collection: collectionConfig,
            context: req.context,
            doc: result,
            req,
          })) || result
      }
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: collectionConfig,
      operation: 'deleteByID',
      result,
    })

    // /////////////////////////////////////
    // 8. Return results
    // /////////////////////////////////////

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return result as TransformCollectionWithSelect<TSlug, TSelect>
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}
