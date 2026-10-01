import type { Payload, PayloadRequest } from '../types/index.js'
import type { EffectiveOperation, EffectiveWrite, ResolvedChange } from './effectiveOperations.js'

import { executeAccess } from '../auth/executeAccess.js'
import { hasWhereAccessResult } from '../auth/types.js'
import { traverseForLocalizedFields } from '../utilities/traverseForLocalizedFields.js'
import { getLatestCollectionVersion } from '../versions/getLatestCollectionVersion.js'
import { getLatestGlobalVersion } from '../versions/getLatestGlobalVersion.js'
import {
  type BranchCreatedTarget,
  hasBranchCreatedDocumentReference,
} from './assertBranchCreatedDocumentsUnreferenced.js'
import { checkFieldAccess } from './checkFieldAccess.js'
import {
  getGlobalMergeLocales,
  readBranchGlobalWrite,
  resolveGlobalMergeWrites,
} from './globalMergeWrites.js'
import { readLocalizedBranchWrite } from './readLocalizedBranchWrite.js'
import { isolateBranchState } from './resolveBranch.js'
import {
  branchChangesCollectionSlug,
  branchDocIDField,
  branchField,
  branchOpField,
  MAIN_BRANCH,
} from './types.js'

export type { EffectiveOperation }

export type BlockedChange = {
  changeID: number | string
  /** Absent for a global. */
  collectionSlug?: string
  /** Absent for a global. */
  docID?: number | string
  docTitle: string
  globalSlug?: string
  message: string
  operation: EffectiveOperation
  reason: 'access' | 'dependency'
}

/** One `(collection, operation)` pair to check, and the change that needs it. */
type PendingOperation = {
  collectionSlug: string
  operation: EffectiveOperation
  previousWrite?: EffectiveWrite
  resolved: ResolvedChange
  write: EffectiveWrite
}

type ProposedWrite = {
  data?: Record<string, unknown>
  dataShape: 'flattened' | 'withLocales'
  locale?: string
  previousData?: Record<string, unknown>
  req: PayloadRequest
}

type BranchCreateChange = {
  changeID: number | string
} & BranchCreatedTarget

type DependencyCandidate = {
  blockedChange: BlockedChange
  dependencyChangeIDs: Set<string>
}

type MergeDependencyPreflightResult = {
  blocked: BlockedChange[]
  dependencyChangeIDsByChangeID: Map<string, Set<string>>
}

type RunMergeDependencyPreflightArgs = {
  initiallyBlocked: BlockedChange[]
  payload: Payload
  pending: ResolvedChange[]
  pendingGlobals: Record<string, unknown>[]
  req: PayloadRequest
}

/**
 * Flattens resolved changes into the operations each one performs.
 *
 * A change can require two permissions — a branch holding a published state and
 * a newer draft publishes *and* updates — and §7 blocks such a change as a whole
 * rather than letting a user who can update but not publish get the draft half.
 */
const toPendingOperations = (pending: ResolvedChange[]): PendingOperation[] =>
  pending.flatMap((resolved) =>
    resolved.writes.map((write, index) => ({
      collectionSlug: resolved.collectionSlug,
      operation: write.operation,
      previousWrite: resolved.writes[index - 1],
      resolved,
      write,
    })),
  )

/**
 * Checks the merging user's production permission for every change.
 *
 * A branch is a proposal; nothing on it is real until merge, which is what
 * makes permissive branch writes safe. This is therefore the enforcement
 * boundary, not a second check layered on top of one.
 *
 * Access functions receive the exact data each effective write proposes. A
 * data-dependent result cannot be shared between documents, so each write is
 * evaluated separately.
 */
export const runMergePreflight = async ({
  payload,
  pending,
  req,
}: {
  payload: Payload
  pending: ResolvedChange[]
  req: PayloadRequest
}): Promise<BlockedChange[]> => {
  const blocked: BlockedChange[] = []
  const blockedChangeIDs = new Set<string>()

  for (const item of toPendingOperations(pending)) {
    const { collectionSlug, operation, resolved } = item
    const changeID = String(resolved.change.id)
    const collectionConfig = payload.collections[collectionSlug]?.config

    if (!collectionConfig || blockedChangeIDs.has(changeID)) {
      continue
    }

    // Publishing is not a distinct access type in Payload — it is `update`
    // evaluated against published data, which is how the admin UI derives
    // whether the publish button is available.
    const accessType = operation === 'publish' ? 'update' : operation
    const accessFn = collectionConfig.access?.[accessType]

    const deny = () => {
      if (blockedChangeIDs.has(changeID)) {
        return
      }

      blockedChangeIDs.add(changeID)
      blocked.push({
        changeID: resolved.change.id,
        collectionSlug,
        docID: resolved.docID,
        docTitle: String(resolved.docID),
        message: `You don't have permission to ${operation} "${collectionSlug}" document ${resolved.docID}.`,
        operation,
        reason: 'access',
      })
    }

    const proposedWrites = await getProposedWrites({
      collectionSlug,
      item,
      payload,
      req,
    })

    for (const proposed of proposedWrites) {
      const result = accessFn
        ? await executeAccess(
            {
              id: operation === 'create' ? undefined : resolved.docID,
              slug: collectionSlug,
              data: proposed.data,
              disableErrors: true,
              req: proposed.req,
            },
            accessFn,
          )
        : true

      if (!result) {
        deny()
        break
      }

      let currentDoc: Record<string, unknown> = {}

      if (operation !== 'create') {
        const where = {
          and: [
            ...(hasWhereAccessResult(result) ? [result] : []),
            { [branchField]: { equals: MAIN_BRANCH } },
            { id: { equals: resolved.docID } },
          ],
        }

        if (proposed.previousData) {
          currentDoc = proposed.previousData

          if (hasWhereAccessResult(result)) {
            if (whereReferencesBranchMetadata(result)) {
              deny()
              break
            }

            const precedingRowID = item.previousWrite?.data.id
            const permittedPreviousState =
              precedingRowID === undefined
                ? null
                : await payload.db.findOne({
                    branch: false,
                    collection: collectionSlug,
                    locale: proposed.locale,
                    req: proposed.req,
                    where: {
                      and: [
                        result,
                        { [branchField]: { equals: resolved.change.branch } },
                        { id: { equals: precedingRowID } },
                      ],
                    },
                  })

            if (!permittedPreviousState) {
              deny()
              break
            }
          }
        } else {
          const mainDoc =
            operation === 'delete'
              ? await payload.db.findOne({
                  branch: false,
                  collection: collectionSlug,
                  locale: proposed.locale,
                  req: proposed.req,
                  where,
                })
              : await getLatestCollectionVersion({
                  id: resolved.docID,
                  config: collectionConfig,
                  payload,
                  query: {
                    branch: false,
                    collection: collectionSlug,
                    locale: proposed.locale,
                    where,
                  },
                  req: proposed.req,
                })

          currentDoc = mainDoc ?? {}

          if (hasWhereAccessResult(result) && !mainDoc) {
            deny()
            break
          }
        }
      }

      if (
        proposed.data &&
        operation !== 'delete' &&
        !(await checkFieldAccess({
          id: operation === 'create' ? undefined : resolved.docID,
          collection: collectionConfig,
          data: proposed.data,
          doc: currentDoc,
          global: null,
          operation: operation === 'create' ? 'create' : 'update',
          req: proposed.req,
        }))
      ) {
        deny()
        break
      }
    }
  }

  return blocked
}

/**
 * Returns the same logical data shapes that merge submits for one write.
 *
 * Localized updates are applied once per locale, so their access checks must
 * receive those per-locale values instead of the adapter's raw all-locale row.
 */
const getProposedWrites = async ({
  collectionSlug,
  item,
  payload,
  req,
}: {
  collectionSlug: string
  item: PendingOperation
  payload: Payload
  req: PayloadRequest
}): Promise<ProposedWrite[]> => {
  if (item.operation === 'delete') {
    return [{ dataShape: 'flattened', req }]
  }

  const localeCodes = payload.config.localization
    ? traverseForLocalizedFields(payload.collections[collectionSlug]!.config.fields)
      ? payload.config.localization.localeCodes
      : undefined
    : undefined
  if (!localeCodes?.length) {
    return [
      {
        data: stripInternal(item.write.data),
        dataShape: 'withLocales',
        previousData: item.previousWrite ? stripInternal(item.previousWrite.data) : undefined,
        req,
      },
    ]
  }

  const proposedWrites: ProposedWrite[] = []

  for (const locale of localeCodes) {
    const localeReq = withLocale({ locale, req })
    const data = await readLocalizedBranchWrite({
      branch: item.resolved.change.branch as string,
      collectionSlug,
      docID: item.resolved.docID,
      draft: item.write.draft,
      locale,
      payload,
      req: localeReq,
    })

    if (!data) {
      continue
    }

    const previousData = item.previousWrite
      ? await readLocalizedBranchWrite({
          branch: item.resolved.change.branch as string,
          collectionSlug,
          docID: item.resolved.docID,
          draft: item.previousWrite.draft,
          locale,
          payload,
          req: localeReq,
        })
      : undefined

    proposedWrites.push({
      data: stripInternal(data),
      dataShape: 'flattened',
      locale,
      previousData: previousData ? stripInternal(previousData) : undefined,
      req: localeReq,
    })
  }

  return proposedWrites
}

const withLocale = ({ locale, req }: { locale: string; req: PayloadRequest }): PayloadRequest => {
  const isolated = isolateBranchState(req)

  isolated.locale = locale

  return isolated
}

/**
 * The same enforcement boundary for globals.
 *
 * The branch copy is the exact data the merge will submit. A `Where` result is
 * applied to the current main global in the same way as an ordinary global update.
 */
export const runGlobalMergePreflight = async ({
  payload,
  pending,
  req,
}: {
  payload: Payload
  pending: Record<string, unknown>[]
  req: PayloadRequest
}): Promise<BlockedChange[]> => {
  const blocked: BlockedChange[] = []

  for (const change of pending) {
    const branch = change.branch as string
    const globalSlug = change.globalSlug as string
    const globalConfig = payload.globals?.config?.find((each) => each.slug === globalSlug)

    if (!globalConfig) {
      continue
    }

    const writes = await resolveGlobalMergeWrites({ branch, globalSlug, payload, req })
    const locales = getGlobalMergeLocales({ globalSlug, payload, req })
    const previousDataByLocale = new Map<string, Record<string, unknown>>()
    let hasAccess = writes.length > 0

    for (const write of writes) {
      for (const locale of locales) {
        const localeReq = withLocale({ locale, req })
        const storedData = await readBranchGlobalWrite({
          branch,
          draft: write.draft,
          globalSlug,
          locale,
          payload,
          req: localeReq,
        })

        if (!storedData) {
          hasAccess = false
          break
        }

        const data = stripInternal({ ...storedData, globalType: undefined })
        const result = await executeAccess(
          { slug: globalSlug, data, disableErrors: true, req: localeReq },
          globalConfig.access.update,
        )

        if (!result) {
          hasAccess = false
          break
        }

        const previousData = previousDataByLocale.get(locale)
        let currentGlobal: Record<string, unknown>

        if (previousData) {
          currentGlobal = previousData

          if (hasWhereAccessResult(result)) {
            if (whereReferencesBranchMetadata(result)) {
              hasAccess = false
              break
            }

            const permittedPreviousState = await payload.db.findGlobal({
              slug: globalSlug,
              branch: false,
              locale,
              req: localeReq,
              where: {
                and: [result, { [branchField]: { equals: branch } }],
              },
            })

            if (!permittedPreviousState || Object.keys(permittedPreviousState).length === 0) {
              hasAccess = false
              break
            }
          }
        } else {
          const { global, globalExists } = await getLatestGlobalVersion({
            slug: globalSlug,
            config: globalConfig,
            locale,
            payload,
            published: !write.draft,
            req: localeReq,
            storageWhere: { [branchField]: { equals: MAIN_BRANCH } },
            where: hasWhereAccessResult(result) ? result : undefined!,
          })

          currentGlobal = (global as null | Record<string, unknown>) ?? {}

          if (
            hasWhereAccessResult(result) &&
            globalExists &&
            Object.keys(currentGlobal).length === 0
          ) {
            hasAccess = false
            break
          }
        }

        if (
          !(await checkFieldAccess({
            collection: null,
            data,
            doc: currentGlobal,
            global: globalConfig,
            operation: 'update',
            req: localeReq,
          }))
        ) {
          hasAccess = false
          break
        }

        previousDataByLocale.set(locale, data)
      }

      if (!hasAccess) {
        break
      }
    }

    if (!hasAccess) {
      const label = typeof globalConfig.label === 'string' ? globalConfig.label : globalConfig.slug

      blocked.push({
        changeID: change.id as number | string,
        docTitle: label,
        globalSlug,
        message: `You do not have permission to update ${label}.`,
        operation: 'update',
        reason: 'access',
      })
    }
  }

  return blocked
}

/**
 * Blocks selected changes that would make main refer to content which only exists on a branch.
 *
 * Dependencies are resolved as a group. This also handles chains: if one selected create is
 * blocked, every selected change which depends on that create becomes blocked in turn.
 */
export const runMergeDependencyPreflight = async ({
  initiallyBlocked,
  payload,
  pending,
  pendingGlobals,
  req,
}: RunMergeDependencyPreflightArgs): Promise<BlockedChange[]> =>
  (
    await resolveMergeDependencies({
      initiallyBlocked,
      payload,
      pending,
      pendingGlobals,
      req,
    })
  ).blocked

export const hasUnavailableBranchCreatedDependency = async ({
  collectionSlug,
  data,
  globalSlug,
  payload,
  req,
}: {
  collectionSlug?: string
  data: Record<string, unknown>
  globalSlug?: string
  payload: Payload
  req: PayloadRequest
}): Promise<boolean> => {
  const fields = collectionSlug
    ? payload.collections[collectionSlug]?.config.flattenedFields
    : payload.globals.config.find(({ slug }) => slug === globalSlug)?.flattenedFields

  if (!fields) {
    return false
  }

  const branchCreates = await findPendingBranchCreates({ payload, req })

  return branchCreates.some((target) =>
    hasBranchCreatedDocumentReference({
      data,
      dataShape: 'withLocales',
      fields,
      payloadBlocks: payload.blocks,
      req,
      target,
    }),
  )
}

export const resolveMergeDependencies = async ({
  initiallyBlocked,
  payload,
  pending,
  pendingGlobals,
  req,
}: RunMergeDependencyPreflightArgs): Promise<MergeDependencyPreflightResult> => {
  // Deliberately spans every branch. A stored relationship can name a document
  // created on another branch, and that target is unavailable on main too.
  const branchCreates = await findPendingBranchCreates({ payload, req })

  if (!branchCreates.length) {
    return { blocked: [], dependencyChangeIDsByChangeID: new Map() }
  }

  const blockedChangeIDs = new Set(initiallyBlocked.map(({ changeID }) => String(changeID)))
  const selectedChangeIDs = new Set([
    ...pending.map(({ change }) => String(change.id)),
    ...pendingGlobals.map(({ id }) => String(id)),
  ])
  const candidates: DependencyCandidate[] = []

  for (const resolved of pending) {
    if (blockedChangeIDs.has(String(resolved.change.id))) {
      continue
    }

    const collectionConfig = payload.collections[resolved.collectionSlug]?.config

    if (!collectionConfig) {
      continue
    }

    const dependencyChangeIDs = new Set<string>()

    for (const item of toPendingOperations([resolved])) {
      if (item.operation === 'delete') {
        continue
      }

      const proposedWrites = await getProposedWrites({
        collectionSlug: resolved.collectionSlug,
        item,
        payload,
        req,
      })

      for (const proposed of proposedWrites) {
        if (!proposed.data) {
          continue
        }

        addReferencedBranchCreates({
          branchCreates,
          data: proposed.data,
          dataShape: proposed.dataShape,
          dependencyChangeIDs,
          fields: collectionConfig.flattenedFields,
          payload,
          req: proposed.req,
        })
      }
    }

    if (dependencyChangeIDs.size) {
      candidates.push({
        blockedChange: {
          changeID: resolved.change.id,
          collectionSlug: resolved.collectionSlug,
          docID: resolved.docID,
          docTitle: String(resolved.docID),
          message:
            'This change refers to branch-created content that will not be available on main.',
          operation: resolved.writes[0]?.operation ?? 'update',
          reason: 'dependency',
        },
        dependencyChangeIDs,
      })
    }
  }

  for (const change of pendingGlobals) {
    if (blockedChangeIDs.has(String(change.id))) {
      continue
    }

    const branch = change.branch as string
    const globalSlug = change.globalSlug as string
    const globalConfig = payload.globals.config.find(({ slug }) => slug === globalSlug)

    if (!globalConfig) {
      continue
    }

    const dependencyChangeIDs = new Set<string>()
    const writes = await resolveGlobalMergeWrites({ branch, globalSlug, payload, req })
    const locales = getGlobalMergeLocales({ globalSlug, payload, req })

    for (const write of writes) {
      for (const locale of locales) {
        const localeReq = withLocale({ locale, req })
        const storedData = await readBranchGlobalWrite({
          branch,
          draft: write.draft,
          globalSlug,
          locale,
          payload,
          req: localeReq,
        })

        if (!storedData) {
          continue
        }

        addReferencedBranchCreates({
          branchCreates,
          data: stripInternal({ ...storedData, globalType: undefined }),
          dataShape: 'flattened',
          dependencyChangeIDs,
          fields: globalConfig.flattenedFields,
          payload,
          req: localeReq,
        })
      }
    }

    if (dependencyChangeIDs.size) {
      candidates.push({
        blockedChange: {
          changeID: change.id as number | string,
          docTitle: globalSlug,
          globalSlug,
          message:
            'This change refers to branch-created content that will not be available on main.',
          operation: 'update',
          reason: 'dependency',
        },
        dependencyChangeIDs,
      })
    }
  }

  const dependencyBlocked: BlockedChange[] = []
  const dependencyChangeIDsByChangeID = new Map(
    candidates.map(({ blockedChange, dependencyChangeIDs }) => [
      String(blockedChange.changeID),
      dependencyChangeIDs,
    ]),
  )
  let hasNewlyBlockedChange = true

  while (hasNewlyBlockedChange) {
    hasNewlyBlockedChange = false

    for (const candidate of candidates) {
      const changeID = String(candidate.blockedChange.changeID)

      if (blockedChangeIDs.has(changeID)) {
        continue
      }

      const hasUnavailableDependency = [...candidate.dependencyChangeIDs].some(
        (dependencyChangeID) =>
          !selectedChangeIDs.has(dependencyChangeID) || blockedChangeIDs.has(dependencyChangeID),
      )

      if (hasUnavailableDependency) {
        blockedChangeIDs.add(changeID)
        dependencyBlocked.push(candidate.blockedChange)
        hasNewlyBlockedChange = true
      }
    }
  }

  return { blocked: dependencyBlocked, dependencyChangeIDsByChangeID }
}

const findPendingBranchCreates = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<BranchCreateChange[]> => {
  const pendingBranchCreates = await payload.find({
    collection: branchChangesCollectionSlug,
    depth: 0,
    limit: 0,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [{ entityType: { equals: 'collection' } }, { operation: { equals: 'create' } }],
    },
  })

  return getBranchCreateChanges({
    changes: pendingBranchCreates.docs as Record<string, unknown>[],
  })
}

const getBranchCreateChanges = ({
  changes,
}: {
  changes: Record<string, unknown>[]
}): BranchCreateChange[] =>
  changes.flatMap((change) => {
    if (change.entityType === 'global' || change.operation !== 'create') {
      return []
    }

    const collectionSlug = change.collectionSlug
    const docID = getChangeDocumentID({ change })

    if (
      typeof collectionSlug !== 'string' ||
      (typeof docID !== 'number' && typeof docID !== 'string') ||
      (typeof change.id !== 'number' && typeof change.id !== 'string')
    ) {
      return []
    }

    return [{ changeID: change.id, collectionSlug, docID }]
  })

const getChangeDocumentID = ({ change }: { change: Record<string, unknown> }): unknown => {
  const doc = change.doc

  if (doc && typeof doc === 'object' && 'value' in doc) {
    return (doc as { value: unknown }).value
  }

  return doc
}

const addReferencedBranchCreates = ({
  branchCreates,
  data,
  dataShape,
  dependencyChangeIDs,
  fields,
  payload,
  req,
}: {
  branchCreates: BranchCreateChange[]
  data: Record<string, unknown>
  dataShape: ProposedWrite['dataShape']
  dependencyChangeIDs: Set<string>
  fields: Parameters<typeof hasBranchCreatedDocumentReference>[0]['fields']
  payload: Payload
  req: PayloadRequest
}): void => {
  for (const target of branchCreates) {
    if (
      hasBranchCreatedDocumentReference({
        data,
        dataShape,
        fields,
        payloadBlocks: payload.blocks,
        req,
        target,
      })
    ) {
      dependencyChangeIDs.add(String(target.changeID))
    }
  }
}

const whereReferencesBranchMetadata = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.some(whereReferencesBranchMetadata)
  }

  if (!value || typeof value !== 'object') {
    return false
  }

  return Object.entries(value).some(
    ([key, nestedValue]) =>
      [branchDocIDField, branchField, branchOpField].includes(key.split('.')[0]!) ||
      whereReferencesBranchMetadata(nestedValue),
  )
}

/** Branch bookkeeping and server-owned timestamps are not part of the proposed user data. */
const stripInternal = (data: Record<string, unknown>): Record<string, unknown> => {
  const {
    id: _id,
    [branchDocIDField]: _docID,
    [branchField]: _branch,
    [branchOpField]: _op,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data

  return rest
}
