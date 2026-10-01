import { status as httpStatus } from 'http-status'

import type { BranchDeleteOutcome } from '../../branching/tombstone.js'
import type { AccessResult } from '../../config/types.js'
import type { CollectionSlug, FindOptions } from '../../index.js'
import type { PayloadRequest, PopulateType, SelectType, Where } from '../../types/index.js'
import type { DeferredCleanupScope } from '../../utilities/transactionCallbacks.js'
import type {
  BulkOperationResult,
  Collection,
  DataFromCollectionSlug,
  SelectFromCollectionSlug,
} from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { resetBranchState, resolveBranch } from '../../branching/resolveBranch.js'
import {
  assertBranchCreatedDeleteUnreferenced,
  assertBranchDeleteCanUseCallerTransaction,
  requireBranchDeleteOutcome,
  setBranchDeleteOperation,
  willBranchAbsorbDelete,
} from '../../branching/tombstone.js'
import { MAIN_BRANCH } from '../../branching/types.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { sanitizeWhereQuery } from '../../database/sanitizeWhereQuery.js'
import { APIError, Locked } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { deleteUserPreferences } from '../../preferences/deleteUserPreferences.js'
import { deleteAssociatedFiles } from '../../uploads/deleteAssociatedFiles.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import {
  deleteDocumentLocks,
  getDocumentLockState,
} from '../../utilities/checkDocumentLockStatus.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { hasScheduledPublishEnabled } from '../../utilities/getVersionsConfig.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { isErrorPublic } from '../../utilities/isErrorPublic.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { resolveSelect } from '../../utilities/resolveSelect.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import {
  beginDeferredCleanupScope,
  clearDeferredCleanupScope,
  flushDeferredCleanupScope,
  flushDeferredCleanupScopeAfterOperation,
} from '../../utilities/transactionCallbacks.js'
import { markTransactionWrite } from '../../utilities/transactionMutationTracker.js'
import { deleteCollectionVersions } from '../../versions/deleteCollectionVersions.js'
import { deleteScheduledPublishJobs } from '../../versions/deleteScheduledPublishJobs.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'

export type Arguments = {
  collection: Collection
  depth?: number
  disableTransaction?: boolean
  overrideAccess?: boolean
  overrideLock?: boolean
  populate?: PopulateType
  req: PayloadRequest
  showHiddenFields?: boolean
  trash?: boolean
  where: Where
} & Pick<FindOptions<string, SelectType>, 'select'>

export const deleteOperation = async <
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  incomingArgs: Arguments,
): Promise<BulkOperationResult<TSlug, TSelect>> => {
  let args = incomingArgs
  let cleanupScope: DeferredCleanupScope | null = null
  let hasCallerTransaction = false
  let shouldCommit = false
  if (args.collection.config.disableBulkDelete && !args.overrideAccess) {
    throw new APIError(`Collection ${args.collection.config.slug} has disabled bulk delete`, 403)
  }

  try {
    hasCallerTransaction = Boolean(await args.req.transactionID)
    shouldCommit =
      !args.disableTransaction &&
      !args.req.payload.db.bulkOperationsSingleTransaction &&
      (await initTransaction(args.req))
    const hasSharedTransaction = hasCallerTransaction || shouldCommit
    cleanupScope = await beginDeferredCleanupScope({ req: args.req })
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'delete',
      overrideAccess: args.overrideAccess!,
    })

    const {
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
      trash = false,
      where,
    } = args

    if (!where) {
      throw new APIError("Missing 'where' query of documents to delete.", httpStatus.BAD_REQUEST)
    }

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    let accessResult: AccessResult

    if (!overrideAccess) {
      accessResult = await executeAccess(
        { slug: collectionConfig.slug, req },
        collectionConfig.access.delete,
      )
    }

    await validateQueryPaths({
      collectionConfig,
      overrideAccess: overrideAccess!,
      req,
      where,
    })

    let fullWhere = combineQueries(where, accessResult!)

    // Exclude trashed documents when trash: false
    fullWhere = appendNonTrashedFilter({
      enableTrash: collectionConfig.trash,
      trash,
      where: fullWhere,
    })

    sanitizeWhereQuery({ fields: collectionConfig.flattenedFields, payload, where: fullWhere })

    const select = sanitizeSelect({
      fields: collectionConfig.flattenedFields,
      select: resolveSelect({
        config: collectionConfig.select,
        operation: 'delete',
        req,
        select: incomingSelect,
      }),
    })

    // /////////////////////////////////////
    // Retrieve documents
    // /////////////////////////////////////

    const { docs } = await payload.db.find<DataFromCollectionSlug<TSlug>>({
      collection: collectionConfig.slug,
      locale: locale!,
      req,
      select,
      where: fullWhere,
    })

    const errors: BulkOperationResult<TSlug, TSelect>['errors'] = []
    let didBatchDeleteFail = false

    type Doc = DataFromCollectionSlug<TSlug>
    type ResultDoc = BulkOperationResult<TSlug, TSelect>['docs'][number]
    type CheckedDeleteEntry = {
      doc: Doc
      fullDocument: Doc
      index: number
      lockDocumentIDs: (number | string)[]
    }
    type DeleteEntry = {
      absorbedByBranch: boolean
    } & CheckedDeleteEntry

    const deletedDocumentIDs = new Map<string, number | string>()
    const hasWriteCapableBeforeDeleteHooks = Boolean(collectionConfig.hooks?.beforeDelete?.length)
    const branch = resolveBranch(req)
    const isDeletingFromBranch =
      Boolean(
        config.branching?.enabled &&
          config.branching.branchableCollections.has(collectionConfig.slug),
      ) && branch !== MAIN_BRANCH

    const pushError = (id: number | string, error: unknown, message?: string) => {
      errors.push({
        id,
        isPublic: error instanceof Error ? isErrorPublic(error, config) : false,
        message: message ?? (error instanceof Error ? error.message : 'Unknown error'),
      })
    }

    // /////////////////////////////////////
    // beforeDelete - Collection, and associated files
    // /////////////////////////////////////

    const assertDeleteUnreferenced = async ({ doc }: { doc: Doc }): Promise<Doc> =>
      (await assertBranchCreatedDeleteUnreferenced({
        collectionSlug: collectionConfig.slug,
        doc,
        req,
      })) as Doc

    const runBeforeDeleteHooks = async ({ doc }: { doc: Doc }): Promise<void> => {
      if (collectionConfig.hooks?.beforeDelete?.length) {
        for (const hook of collectionConfig.hooks.beforeDelete) {
          await hook({
            id: doc.id,
            collection: collectionConfig,
            context: req.context,
            req,
          })
        }
      }
    }

    const runDeleteCleanup = async ({
      fullDocument,
      isTombstone,
    }: {
      fullDocument: Doc
      isTombstone?: boolean
    }): Promise<boolean> => {
      const absorbedByBranch =
        isTombstone ??
        willBranchAbsorbDelete({
          collectionSlug: collectionConfig.slug,
          doc: fullDocument,
          req,
        })

      if (!absorbedByBranch) {
        await deleteAssociatedFiles({
          collectionConfig,
          config,
          doc: fullDocument,
          overrideDelete: true,
          req,
        })
      }

      return absorbedByBranch
    }

    const runBeforeDeleteHooksInDocumentTransaction = async ({
      entry,
    }: {
      entry: CheckedDeleteEntry
    }): Promise<CheckedDeleteEntry | null> => {
      let hookCleanupScope: DeferredCleanupScope | null = null
      let hookShouldCommit = false

      try {
        hookShouldCommit = await initTransaction(req)
        hookCleanupScope = await beginDeferredCleanupScope({ req })

        await runBeforeDeleteHooks({ doc: entry.doc })
        await flushDeferredCleanupScope({ req, scope: hookCleanupScope })

        if (hookShouldCommit) {
          await commitTransaction(req)
        }

        return entry
      } catch (error) {
        if (hookCleanupScope) {
          clearDeferredCleanupScope({ req, scope: hookCleanupScope })
        }

        if (hookShouldCommit) {
          await killTransaction(req)
        }

        if (hasCallerTransaction) {
          throw error
        }

        pushError(entry.doc.id, error)

        return null
      }
    }

    const prepareDocumentsForDelete = async (): Promise<CheckedDeleteEntry[]> => {
      const { lockDocumentIDsByDocumentID, lockedDocumentIDs } = await getDocumentLockState({
        collectionSlug: collectionConfig.slug,
        ids: docs.map(({ id }) => id),
        overrideLock,
        req,
      })

      const unlocked: { doc: Doc; index: number }[] = []

      docs.forEach((doc, index) => {
        if (lockedDocumentIDs.has(String(doc.id))) {
          pushError(
            doc.id,
            new Locked(`Document with ID ${doc.id} is currently locked and cannot be deleted.`),
          )

          return
        }

        unlocked.push({ doc, index })
      })

      const initialCheckResults = await Promise.all(
        unlocked.map(async (entry): Promise<CheckedDeleteEntry | null> => {
          try {
            const fullDocument = await assertDeleteUnreferenced({ doc: entry.doc })

            if (hasCallerTransaction && isDeletingFromBranch) {
              await assertBranchDeleteCanUseCallerTransaction({
                branch,
                collectionSlug: collectionConfig.slug,
                docID: entry.doc.id,
                req,
              })
            }

            return {
              ...entry,
              fullDocument,
              lockDocumentIDs: lockDocumentIDsByDocumentID.get(String(entry.doc.id)) ?? [],
            }
          } catch (error) {
            pushError(entry.doc.id, error)

            return null
          }
        }),
      )
      const initiallyChecked = initialCheckResults.filter(
        (entry): entry is CheckedDeleteEntry => entry !== null,
      )

      const hookResults: (CheckedDeleteEntry | null)[] = []

      if (req.payload.db.bulkOperationsSingleTransaction) {
        for (const entry of initiallyChecked) {
          hookResults.push(
            hasWriteCapableBeforeDeleteHooks
              ? await runBeforeDeleteHooksInDocumentTransaction({ entry })
              : entry,
          )
        }
      } else if (hasSharedTransaction) {
        for (const entry of initiallyChecked) {
          await runBeforeDeleteHooks({ doc: entry.doc })
          hookResults.push(entry)
        }
      } else {
        hookResults.push(
          ...(await Promise.all(
            initiallyChecked.map(async (entry): Promise<CheckedDeleteEntry | null> => {
              try {
                await runBeforeDeleteHooks({ doc: entry.doc })

                return entry
              } catch (error) {
                pushError(entry.doc.id, error)

                return null
              }
            }),
          )),
        )
      }

      const hookCompleted = hookResults.filter(
        (entry): entry is CheckedDeleteEntry => entry !== null,
      )
      const {
        lockDocumentIDsByDocumentID: refreshedLockDocumentIDsByDocumentID,
        lockedDocumentIDs: refreshedLockedDocumentIDs,
      } = await getDocumentLockState({
        collectionSlug: collectionConfig.slug,
        ids: hookCompleted.map(({ doc }) => doc.id),
        overrideLock,
        req,
      })
      const lockCheckedAfterHooks: CheckedDeleteEntry[] = []

      for (const entry of hookCompleted) {
        const documentID = String(entry.doc.id)

        if (refreshedLockedDocumentIDs.has(documentID)) {
          pushError(
            entry.doc.id,
            new Locked(
              `Document with ID ${entry.doc.id} is currently locked and cannot be deleted.`,
            ),
          )

          continue
        }

        lockCheckedAfterHooks.push({
          ...entry,
          lockDocumentIDs: refreshedLockDocumentIDsByDocumentID.get(documentID) ?? [],
        })
      }

      const postHookCheckResults: (CheckedDeleteEntry | null)[] = []

      if (hasSharedTransaction) {
        for (const entry of lockCheckedAfterHooks) {
          const fullDocument = await assertDeleteUnreferenced({ doc: entry.fullDocument })

          postHookCheckResults.push({ ...entry, fullDocument })
        }
      } else {
        postHookCheckResults.push(
          ...(await Promise.all(
            lockCheckedAfterHooks.map(async (entry): Promise<CheckedDeleteEntry | null> => {
              try {
                const fullDocument = await assertDeleteUnreferenced({ doc: entry.fullDocument })

                return { ...entry, fullDocument }
              } catch (error) {
                pushError(entry.doc.id, error)

                return null
              }
            }),
          )),
        )
      }

      return postHookCheckResults.filter((entry): entry is CheckedDeleteEntry => entry !== null)
    }

    // /////////////////////////////////////
    // afterRead - Fields, afterRead - Collection, afterDelete - Collection
    // /////////////////////////////////////

    const runAfterDeleteWork = async (doc: Doc): Promise<ResultDoc> => {
      let result = await afterRead({
        collection: collectionConfig,
        context: req.context,
        depth: depth!,
        doc,
        // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
        draft: undefined,
        fallbackLocale: fallbackLocale!,
        global: null,
        locale: locale!,
        overrideAccess: overrideAccess!,
        populate,
        req,
        select,
        showHiddenFields: showHiddenFields!,
      })

      // Add collection property for auth collections
      if (collectionConfig.auth) {
        result = { ...result, collection: collectionConfig.slug }
      }

      if (collectionConfig.hooks?.afterRead?.length) {
        for (const hook of collectionConfig.hooks.afterRead) {
          result =
            (await hook({
              collection: collectionConfig,
              context: req.context,
              doc: result || doc,
              overrideAccess,
              req,
            })) || result
        }
      }

      if (collectionConfig.hooks?.afterDelete?.length) {
        for (const hook of collectionConfig.hooks.afterDelete) {
          result =
            (await hook({
              id: doc.id,
              collection: collectionConfig,
              context: req.context,
              doc: result,
              req,
            })) || result
        }
      }

      return result as ResultDoc
    }

    /**
     * One transaction and one set of database calls per document. Only used when
     * `bulkOperationsSingleTransaction` is enabled, which requires each document to be committed
     * on its own and therefore cannot share a batched write with the rest of the operation.
     */
    const deleteDocumentIndividually = async ({
      doc,
      fullDocument: initiallyCheckedDocument,
      lockDocumentIDs,
    }: CheckedDeleteEntry): Promise<null | ResultDoc> => {
      let docCleanupScope: DeferredCleanupScope | null = null
      let docShouldCommit = false
      let hasReachedWriteCapableStage = hasCallerTransaction && hasWriteCapableBeforeDeleteHooks

      try {
        docShouldCommit = await initTransaction(req)
        docCleanupScope = await beginDeferredCleanupScope({ req })

        const fullDocument = await assertDeleteUnreferenced({ doc: initiallyCheckedDocument })
        const absorbedByBranch = willBranchAbsorbDelete({
          collectionSlug: collectionConfig.slug,
          doc: fullDocument,
          req,
        })
        let branchDeleteOutcome: BranchDeleteOutcome | undefined

        if (!isDeletingFromBranch) {
          await runDeleteCleanup({ fullDocument })

          if (collectionConfig.versions) {
            hasReachedWriteCapableStage = true
            await deleteCollectionVersions({
              id: doc.id,
              slug: collectionConfig.slug,
              payload,
              req,
            })
          }

          if (hasScheduledPublishEnabled(collectionConfig) && !absorbedByBranch) {
            hasReachedWriteCapableStage = true
            await deleteScheduledPublishJobs({
              id: doc.id,
              slug: collectionConfig.slug,
              payload,
              req,
            })
          }
        }

        hasReachedWriteCapableStage = true
        if (isDeletingFromBranch) {
          setBranchDeleteOperation({
            branch,
            collectionSlug: collectionConfig.slug,
            docID: doc.id,
            isTombstoneExpected: absorbedByBranch,
            onResolved: (outcome) => {
              branchDeleteOutcome = outcome
            },
            req,
            useAmbientTransaction: docShouldCommit,
          })
        }
        await payload.db.deleteOne({
          collection: collectionConfig.slug,
          req,
          returning: false,
          where: {
            id: {
              equals: doc.id,
            },
          },
        })
        markTransactionWrite({ req })

        const finalBranchDeleteOutcome = isDeletingFromBranch
          ? requireBranchDeleteOutcome({ outcome: branchDeleteOutcome })
          : ({ doc: fullDocument, tombstoned: false } as const)

        if (!finalBranchDeleteOutcome.tombstoned) {
          deletedDocumentIDs.set(String(doc.id), doc.id)
        }

        if (isDeletingFromBranch) {
          await runDeleteCleanup({
            fullDocument: finalBranchDeleteOutcome.doc as Doc,
            isTombstone: finalBranchDeleteOutcome.tombstoned,
          })

          if (collectionConfig.versions) {
            hasReachedWriteCapableStage = true
            await deleteCollectionVersions({
              id: doc.id,
              slug: collectionConfig.slug,
              payload,
              req,
            })
          }

          if (
            hasScheduledPublishEnabled(collectionConfig) &&
            !finalBranchDeleteOutcome.tombstoned
          ) {
            hasReachedWriteCapableStage = true
            await deleteScheduledPublishJobs({
              id: doc.id,
              slug: collectionConfig.slug,
              payload,
              req,
            })
          }
        }

        await deleteDocumentLocks({
          collectionSlug: collectionConfig.slug,
          ids: [doc.id],
          lockDocumentIDs,
          req,
        })

        const result = await runAfterDeleteWork(
          isDeletingFromBranch ? (finalBranchDeleteOutcome.doc as Doc) : doc,
        )

        if (docCleanupScope) {
          await flushDeferredCleanupScope({ req, scope: docCleanupScope })
        }
        if (docShouldCommit) {
          await commitTransaction(req)
        }

        return result
      } catch (error) {
        if (docCleanupScope) {
          clearDeferredCleanupScope({ req, scope: docCleanupScope })
        }

        if (docShouldCommit) {
          await killTransaction(req)
          deletedDocumentIDs.delete(String(doc.id))
          resetBranchState(req)
        }

        if (hasCallerTransaction && hasReachedWriteCapableStage) {
          throw error
        }

        pushError(doc.id, error)

        return null
      }
    }

    /**
     * Deletes unbranched rows as one batch. Branch deletes use the per-document adapter path so it
     * can create tombstones and remove branch-created rows from the change registry. Hooks still
     * run for each document.
     */
    const deleteDocumentsInBulk = async (
      preparedDocuments: CheckedDeleteEntry[],
    ): Promise<(null | ResultDoc)[]> => {
      const results: (null | ResultDoc)[] = new Array(docs.length).fill(null)
      let deletable: DeleteEntry[]

      if (isDeletingFromBranch) {
        deletable = preparedDocuments.map((entry) => ({
          ...entry,
          absorbedByBranch: willBranchAbsorbDelete({
            collectionSlug: collectionConfig.slug,
            doc: entry.fullDocument,
            req,
          }),
        }))
      } else {
        const cleanupResults: (DeleteEntry | null)[] = []

        for (const entry of preparedDocuments) {
          let documentCleanupScope: DeferredCleanupScope | null = null

          try {
            documentCleanupScope = await beginDeferredCleanupScope({ req })
            const absorbedByBranch = await runDeleteCleanup({
              fullDocument: entry.fullDocument,
            })

            await flushDeferredCleanupScope({ req, scope: documentCleanupScope })
            cleanupResults.push({ ...entry, absorbedByBranch })
          } catch (error) {
            if (documentCleanupScope) {
              clearDeferredCleanupScope({ req, scope: documentCleanupScope })
            }

            if (hasSharedTransaction && hasWriteCapableBeforeDeleteHooks) {
              throw error
            }

            pushError(entry.doc.id, error)
            cleanupResults.push(null)
          }
        }

        deletable = cleanupResults.filter((entry): entry is DeleteEntry => entry !== null)
      }

      if (!deletable.length) {
        return results
      }

      const ids = deletable.map(({ doc }) => doc.id)
      const lockDocumentIDs = deletable.flatMap((entry) => entry.lockDocumentIDs)
      const hardDeleteIDs = deletable
        .filter(({ absorbedByBranch }) => !absorbedByBranch)
        .map(({ doc }) => doc.id)

      if (!isDeletingFromBranch) {
        // /////////////////////////////////////
        // Delete versions
        // /////////////////////////////////////

        if (collectionConfig.versions) {
          await deleteCollectionVersions({
            slug: collectionConfig.slug,
            ids,
            payload,
            req,
          })
        }

        // /////////////////////////////////////
        // Delete scheduled posts
        // /////////////////////////////////////

        if (hasScheduledPublishEnabled(collectionConfig) && hardDeleteIDs.length) {
          await deleteScheduledPublishJobs({
            slug: collectionConfig.slug,
            ids: hardDeleteIDs,
            payload,
            req,
          })
        }
      }

      // /////////////////////////////////////
      // Delete documents
      // /////////////////////////////////////

      const deletedInBatch: (number | string)[] = []
      const branchDeleteOutcomes = new Map<string, BranchDeleteOutcome>()

      try {
        if (isDeletingFromBranch) {
          for (const { absorbedByBranch, doc } of deletable) {
            setBranchDeleteOperation({
              branch,
              collectionSlug: collectionConfig.slug,
              docID: doc.id,
              isTombstoneExpected: absorbedByBranch,
              onResolved: (outcome) => {
                branchDeleteOutcomes.set(String(doc.id), outcome)
              },
              req,
              useAmbientTransaction: shouldCommit,
            })
            await payload.db.deleteOne({
              collection: collectionConfig.slug,
              req,
              returning: false,
              where: {
                id: {
                  equals: doc.id,
                },
              },
            })
            markTransactionWrite({ req })

            const finalBranchDeleteOutcome = requireBranchDeleteOutcome({
              outcome: branchDeleteOutcomes.get(String(doc.id)),
            })

            if (!finalBranchDeleteOutcome.tombstoned) {
              deletedDocumentIDs.set(String(doc.id), doc.id)
            }
            deletedInBatch.push(doc.id)
          }
        } else {
          await payload.db.deleteMany({
            collection: collectionConfig.slug,
            req,
            where: {
              id: {
                in: ids,
              },
            },
          })
          markTransactionWrite({ req })

          for (const id of ids) {
            deletedDocumentIDs.set(String(id), id)
            deletedInBatch.push(id)
          }
        }

        if (isDeletingFromBranch) {
          for (const { doc } of deletable) {
            const finalBranchDeleteOutcome = requireBranchDeleteOutcome({
              outcome: branchDeleteOutcomes.get(String(doc.id)),
            })

            await runDeleteCleanup({
              fullDocument: finalBranchDeleteOutcome.doc as Doc,
              isTombstone: finalBranchDeleteOutcome.tombstoned,
            })
          }

          if (collectionConfig.versions) {
            await deleteCollectionVersions({
              slug: collectionConfig.slug,
              ids,
              payload,
              req,
            })
          }

          const finalHardDeleteIDs = deletable
            .filter(({ doc }) => {
              const outcome = requireBranchDeleteOutcome({
                outcome: branchDeleteOutcomes.get(String(doc.id)),
              })

              return !outcome.tombstoned
            })
            .map(({ doc }) => doc.id)

          if (hasScheduledPublishEnabled(collectionConfig) && finalHardDeleteIDs.length) {
            await deleteScheduledPublishJobs({
              slug: collectionConfig.slug,
              ids: finalHardDeleteIDs,
              payload,
              req,
            })
          }
        }

        await deleteDocumentLocks({
          collectionSlug: collectionConfig.slug,
          ids,
          lockDocumentIDs,
          req,
        })
      } catch (error) {
        didBatchDeleteFail = true

        if (shouldCommit) {
          await killTransaction(req)
          resetBranchState(req)

          for (const id of deletedInBatch) {
            deletedDocumentIDs.delete(String(id))
          }
        }

        if (hasCallerTransaction) {
          throw error
        }

        // The delete covers the whole batch, so a failure here belongs to the batch rather than to
        // any single document. Say so explicitly, otherwise one batch failure reads as N unrelated
        // per-document failures.
        const message = `Bulk delete failed for this batch of ${deletable.length} documents: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`

        for (const { doc } of deletable) {
          pushError(doc.id, error, message)
        }

        return results
      }

      if (hasSharedTransaction) {
        for (const entry of deletable) {
          const resultDocument = isDeletingFromBranch
            ? (requireBranchDeleteOutcome({
                outcome: branchDeleteOutcomes.get(String(entry.doc.id)),
              }).doc as Doc)
            : entry.doc

          results[entry.index] = await runAfterDeleteWork(resultDocument)
        }

        return results
      }

      const postDeleteResults = await Promise.all(
        deletable.map(async (entry) => {
          try {
            const resultDocument = isDeletingFromBranch
              ? (requireBranchDeleteOutcome({
                  outcome: branchDeleteOutcomes.get(String(entry.doc.id)),
                }).doc as Doc)
              : entry.doc

            return {
              entry,
              result: await runAfterDeleteWork(resultDocument),
              status: 'fulfilled' as const,
            }
          } catch (error) {
            return { entry, error, status: 'rejected' as const }
          }
        }),
      )

      for (const outcome of postDeleteResults) {
        if (outcome.status === 'rejected') {
          pushError(outcome.entry.doc.id, outcome.error)
        } else {
          results[outcome.entry.index] = outcome.result
        }
      }

      return results
    }

    let awaitedDocs: (null | ResultDoc)[]
    const preparedDocuments = await prepareDocumentsForDelete()

    if (req.payload.db.bulkOperationsSingleTransaction) {
      // Process sequentially so that each document's transaction is isolated from the next
      awaitedDocs = []

      for (const preparedDocument of preparedDocuments) {
        awaitedDocs.push(await deleteDocumentIndividually(preparedDocument))
      }
    } else {
      awaitedDocs = await deleteDocumentsInBulk(preparedDocuments)
    }

    // /////////////////////////////////////
    // Delete Preferences
    // /////////////////////////////////////

    const deletedPreferenceIDs = [...deletedDocumentIDs.values()]

    if (deletedPreferenceIDs.length) {
      await deleteUserPreferences({
        collectionConfig,
        ids: deletedPreferenceIDs,
        payload,
        req,
      })
    }

    let result = {
      docs: awaitedDocs.filter((doc): doc is ResultDoc => Boolean(doc)),
      errors,
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: collectionConfig,
      operation: 'delete',
      overrideAccess,
      result,
    })

    if (cleanupScope) {
      if (didBatchDeleteFail) {
        clearDeferredCleanupScope({ req: args.req, scope: cleanupScope })
      } else {
        await flushDeferredCleanupScopeAfterOperation({ req, scope: cleanupScope })
      }
    }
    if (shouldCommit && !didBatchDeleteFail) {
      await commitTransaction(req)
    }

    return result
  } catch (error: unknown) {
    if (cleanupScope) {
      clearDeferredCleanupScope({ req: args.req, scope: cleanupScope })
    }

    if (shouldCommit) {
      await killTransaction(args.req)
    }
    resetBranchState(args.req)
    throw error
  }
}
