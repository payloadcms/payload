import type { ArrayField, BlocksField, Field } from '../../fields/config/types.js'
import type { Payload, PayloadRequest } from '../../types/index.js'
import type { ResolvedChange } from '../effectiveOperations.js'
import type { AppliedChangeResult, SourceRecoveryOutcome } from './utilities.js'

import {
  type BranchMergeUploadDataContext,
  branchMergeUploadDataContextKey,
  updateByIDOperationForBranchMerge,
} from '../../collections/operations/updateByID.js'
import { copyDataWithFreshRowIDs } from '../../collections/operations/utilities/copyDataWithFreshRowIDs.js'
import { tabHasName } from '../../fields/config/types.js'
import { getVersionsMax } from '../../utilities/getVersionsConfig.js'
import { traverseForLocalizedFields } from '../../utilities/traverseForLocalizedFields.js'
import {
  enforceMaxVersions,
  skipEnforceMaxVersionsContextKey,
} from '../../versions/enforceMaxVersions.js'
import { coalesceLatestVersionContextKey } from '../../versions/updateLatestVersion.js'
import {
  getGlobalMergeLocales,
  readBranchGlobalWrite,
  resolveGlobalMergeWrites,
} from '../globalMergeWrites.js'
import { readLocalizedBranchWrite } from '../readLocalizedBranchWrite.js'
import { isolateBranchState, withoutBranch } from '../resolveBranch.js'
import { stripBranchMergeData, stripBranchMergeGlobalData } from '../stripBranchMergeData.js'
import { branchField, branchParentField, MAIN_BRANCH } from '../types.js'
import { createMainBranchRequest } from '../validation.js'
import { deleteBranchGlobalVersionChain, deleteBranchVersionChain } from '../versions.js'
import { getGlobalSourceRevision, getTimestamp } from './utilities.js'

const forMain = ({
  collectionSlug,
  data,
  payload,
}: {
  collectionSlug: string
  data: Record<string, unknown>
  payload: Payload
}): Record<string, unknown> =>
  copyDataWithFreshRowIDs({
    config: payload.config,
    data: stripBranchMergeData({
      data,
      fields: payload.collections[collectionSlug]!.config.fields,
    }),
    existingDoc: {},
    fields: payload.collections[collectionSlug]!.config.fields,
  })

type NestedRowIDMap = Map<ArrayField | BlocksField, Map<string, number | string>>

/**
 * Reuses IDs that main minted for the same source branch rows during an earlier write.
 * The field key scopes row IDs to the nested table that owns them.
 */
const applyMappedNestedRowIDs = ({
  data,
  fields,
  mainRowIDsBySource,
  payload,
  sourceData,
}: {
  data: Record<string, unknown>
  fields: Field[]
  mainRowIDsBySource: NestedRowIDMap
  payload: Payload
  sourceData: Record<string, unknown>
}): Record<string, unknown> => {
  visitNestedRows({
    data,
    fields,
    payload,
    sourceData,
    visitRow: ({ field, row, sourceRow }) => {
      const sourceRowID = sourceRow.id

      if (typeof sourceRowID !== 'string' && typeof sourceRowID !== 'number') {
        return
      }

      const mappedRowID = mainRowIDsBySource.get(field)?.get(String(sourceRowID))

      if (mappedRowID !== undefined) {
        row.id = mappedRowID
      }
    },
  })

  return data
}

/** Records the main ID for each source branch row after a write succeeds. */
const recordNestedRowIDs = ({
  fields,
  mainRowIDsBySource,
  mergedData,
  payload,
  sourceData,
}: {
  fields: Field[]
  mainRowIDsBySource: NestedRowIDMap
  mergedData: Record<string, unknown>
  payload: Payload
  sourceData: Record<string, unknown>
}): void => {
  visitNestedRows({
    data: mergedData,
    fields,
    payload,
    sourceData,
    visitRow: ({ field, row, sourceRow }) => {
      const mergedRowID = row.id
      const sourceRowID = sourceRow.id

      if (
        (typeof mergedRowID !== 'string' && typeof mergedRowID !== 'number') ||
        (typeof sourceRowID !== 'string' && typeof sourceRowID !== 'number')
      ) {
        return
      }

      let fieldRowIDs = mainRowIDsBySource.get(field)

      if (!fieldRowIDs) {
        fieldRowIDs = new Map()
        mainRowIDsBySource.set(field, fieldRowIDs)
      }

      fieldRowIDs.set(String(sourceRowID), mergedRowID)
    },
  })
}

const visitNestedRows = ({
  data,
  fields,
  payload,
  sourceData,
  visitRow,
}: {
  data: Record<string, unknown>
  fields: Field[]
  payload: Payload
  sourceData: Record<string, unknown>
  visitRow: (args: {
    field: ArrayField | BlocksField
    row: Record<string, unknown>
    sourceRow: Record<string, unknown>
  }) => void
}): void => {
  for (const field of fields) {
    if (field.type === 'row' || field.type === 'collapsible') {
      visitNestedRows({ data, fields: field.fields, payload, sourceData, visitRow })
      continue
    }

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if (!tabHasName(tab)) {
          visitNestedRows({ data, fields: tab.fields, payload, sourceData, visitRow })
          continue
        }

        const nestedData = data[tab.name]
        const nestedSourceData = sourceData[tab.name]

        if (
          nestedData &&
          typeof nestedData === 'object' &&
          !Array.isArray(nestedData) &&
          nestedSourceData &&
          typeof nestedSourceData === 'object' &&
          !Array.isArray(nestedSourceData)
        ) {
          visitNestedRows({
            data: nestedData as Record<string, unknown>,
            fields: tab.fields,
            payload,
            sourceData: nestedSourceData as Record<string, unknown>,
            visitRow,
          })
        }
      }

      continue
    }

    if (field.type === 'group') {
      if (!('name' in field) || !field.name) {
        visitNestedRows({ data, fields: field.fields, payload, sourceData, visitRow })
        continue
      }

      const nestedData = data[field.name]
      const nestedSourceData = sourceData[field.name]

      if (
        nestedData &&
        typeof nestedData === 'object' &&
        !Array.isArray(nestedData) &&
        nestedSourceData &&
        typeof nestedSourceData === 'object' &&
        !Array.isArray(nestedSourceData)
      ) {
        visitNestedRows({
          data: nestedData as Record<string, unknown>,
          fields: field.fields,
          payload,
          sourceData: nestedSourceData as Record<string, unknown>,
          visitRow,
        })
      }

      continue
    }

    if ((field.type !== 'array' && field.type !== 'blocks') || !field.name) {
      continue
    }

    const rows = data[field.name]
    const sourceRows = sourceData[field.name]

    if (!Array.isArray(rows) || !Array.isArray(sourceRows)) {
      continue
    }

    for (const [index, row] of rows.entries()) {
      const sourceRow = sourceRows[index]

      if (
        !row ||
        typeof row !== 'object' ||
        Array.isArray(row) ||
        !sourceRow ||
        typeof sourceRow !== 'object' ||
        Array.isArray(sourceRow)
      ) {
        continue
      }

      const rowData = row as Record<string, unknown>
      const sourceRowData = sourceRow as Record<string, unknown>

      visitRow({ field, row: rowData, sourceRow: sourceRowData })

      const nestedFields =
        field.type === 'array'
          ? field.fields
          : resolveBlockFields({
              field,
              payload,
              row: rowData,
            })

      visitNestedRows({
        data: rowData,
        fields: nestedFields,
        payload,
        sourceData: sourceRowData,
        visitRow,
      })
    }
  }
}

const resolveBlockFields = ({
  field,
  payload,
  row,
}: {
  field: BlocksField
  payload: Payload
  row: Record<string, unknown>
}): Field[] => {
  const blockType = row.blockType

  if (typeof blockType !== 'string') {
    return []
  }

  const block =
    payload.config.blocks?.find(({ slug }) => slug === blockType) ??
    field.blocks.find((candidate) => typeof candidate !== 'string' && candidate.slug === blockType)

  return typeof block === 'string' || !block ? [] : block.fields
}

export const applyChange = async ({
  hasTransaction,
  overrideAccess,
  payload,
  req,
  resolved,
  targetReq,
}: {
  hasTransaction: boolean
  overrideAccess: boolean
  payload: Payload
  req: PayloadRequest
  resolved: ResolvedChange
  targetReq: PayloadRequest
}): Promise<AppliedChangeResult> => {
  const { change, collectionSlug, docID, shadow, writes } = resolved

  if (!shadow) {
    return { cleanup: () => Promise.resolve('completed') }
  }

  const shadowID = shadow.id as number | string
  const branch = change.branch as string
  const mainWriteReq = createMainBranchRequest({ req: targetReq })

  mainWriteReq.file = undefined
  mainWriteReq.payloadUploadSizes = undefined
  mainWriteReq.query = { ...mainWriteReq.query }
  delete mainWriteReq.query.uploadEdits
  delete (mainWriteReq.context as Record<string, unknown>)._payloadCloudStorage
  const sourceTimestamp = getTimestamp({ value: shadow.updatedAt })
  const sourceIdentity = {
    sourceID: String(shadowID),
    sourceUpdatedAt:
      sourceTimestamp === undefined ? undefined : new Date(sourceTimestamp).toISOString(),
  }

  // The chain goes with the row. It hangs off the shadow row's primary key rather
  // than the canonical ID, so nothing addressing the document cascades to it, and a
  // chain left behind keeps the merged document in the branch's drafts list a second
  // time alongside main's copy.
  const dropVersionChain = () =>
    deleteBranchVersionChain({ branch, collectionSlug, payload, req, rowID: shadowID })

  const dropShadowRow = async () => {
    const currentShadow = (await payload.db.findOne({
      branch: false,
      collection: collectionSlug,
      req,
      where: { id: { equals: shadowID } },
    })) as null | Record<string, unknown>

    const currentUpdatedAt = getTimestamp({ value: currentShadow?.updatedAt })
    const mergedSourceUpdatedAt = getTimestamp({ value: shadow.updatedAt })

    if (
      currentUpdatedAt !== undefined &&
      mergedSourceUpdatedAt !== undefined &&
      currentUpdatedAt !== mergedSourceUpdatedAt
    ) {
      return 'superseded' as const
    }

    await dropVersionChain()

    await payload.db.deleteOne({
      branch: false,
      collection: collectionSlug,
      req,
      where: { id: { equals: shadowID } },
    })

    return 'completed' as const
  }

  const updateMainDocument = async ({
    id,
    coalesceLatestVersion,
    data,
    draft,
    locale,
  }: {
    coalesceLatestVersion?: boolean
    data: Record<string, unknown>
    draft: boolean
    id: number | string
    locale?: string
  }): Promise<Record<string, unknown>> => {
    const reqContext = mainWriteReq.context as Record<PropertyKey, unknown>
    const previousBranchMergeUploadData = reqContext[branchMergeUploadDataContextKey]
    const previousCoalesceLatestVersion = reqContext[coalesceLatestVersionContextKey]
    const branchMergeUploadData: BranchMergeUploadDataContext = {
      id,
      collectionSlug,
      data,
    }

    reqContext[branchMergeUploadDataContextKey] = branchMergeUploadData

    if (coalesceLatestVersion) {
      reqContext[coalesceLatestVersionContextKey] = true
    } else {
      delete reqContext[coalesceLatestVersionContextKey]
    }

    try {
      return (await payload.update({
        id,
        collection: collectionSlug,
        data: data as never,
        draft,
        locale,
        overrideAccess,
        req: mainWriteReq,
        trash: includesTrashState(data),
      })) as Record<string, unknown>
    } finally {
      if (previousBranchMergeUploadData === undefined) {
        delete reqContext[branchMergeUploadDataContextKey]
      } else {
        reqContext[branchMergeUploadDataContextKey] = previousBranchMergeUploadData
      }

      if (previousCoalesceLatestVersion === undefined) {
        delete reqContext[coalesceLatestVersionContextKey]
      } else {
        reqContext[coalesceLatestVersionContextKey] = previousCoalesceLatestVersion
      }
    }
  }

  if (change.operation === 'delete') {
    await payload.delete({
      id: docID,
      collection: collectionSlug,
      overrideAccess,
      req: targetReq,
    })

    return { cleanup: dropShadowRow, ...sourceIdentity }
  }

  // A fork that was never edited afterwards. Nothing happened to the document on
  // this branch, so writing main would only bump `updatedAt` and re-run hooks for
  // a no-op — the shadow row is simply discarded.
  if (!writes.length) {
    return { cleanup: dropShadowRow, ...sourceIdentity }
  }

  const fields = payload.collections[collectionSlug]!.config.fields

  if (change.operation === 'create') {
    const actionableWrites = writes.filter((write) => write.trashState !== 'access')
    const [rowWrite, ...laterWrites] = actionableWrites
    const localization = payload.config.localization
    const hasLocalizedFields = traverseForLocalizedFields(
      payload.collections[collectionSlug]!.config.fields,
    )
    const localeCodes = localization && hasLocalizedFields ? localization.localeCodes : undefined
    let localizedWrites: Map<string, Record<string, unknown>>[] | undefined

    if (localeCodes?.length) {
      localizedWrites = []

      for (const write of actionableWrites) {
        const documentsByLocale = new Map<string, Record<string, unknown>>()

        for (const locale of localeCodes) {
          const branchDoc = await readLocalizedBranchWrite({
            branch,
            collectionSlug,
            docID,
            draft: write.draft,
            locale,
            payload,
            req,
          })

          if (branchDoc) {
            documentsByLocale.set(locale, branchDoc)
          }
        }

        localizedWrites.push(documentsByLocale)
      }
    }

    const applyCreateWrites = async () => {
      const branchMergeStorageReq = withoutBranch(req)
      const createTargetReq = mainWriteReq

      // Updated in place rather than recreated. The row already holds the ID that
      // inbound relationships point at, and deleting it would cascade those
      // relationship rows away — rebuilding the row does not bring them back.
      // The branch-merge operation still reports it as a create, because from
      // main's point of view the document is new.
      if (localeCodes?.length) {
        const defaultLocale = localization && localization.defaultLocale
        const createLocale =
          defaultLocale && localeCodes.includes(defaultLocale) ? defaultLocale : localeCodes[0]!
        const branchDoc = localizedWrites?.[0]?.get(createLocale)

        if (branchDoc) {
          const data = stripBranchMergeData({ data: branchDoc, fields })

          await updateByIDOperationForBranchMerge({
            id: shadowID,
            branchMergeStorageReq,
            collection: payload.collections[collectionSlug]!,
            data: data as never,
            draft: rowWrite!.draft,
            overrideAccess,
            req: withLocale({ locale: createLocale, req: createTargetReq }),
            trash: includesTrashState(data),
          })
        }
      } else {
        const data = stripBranchMergeData({ data: rowWrite!.data, fields })

        await updateByIDOperationForBranchMerge({
          id: shadowID,
          branchMergeStorageReq,
          collection: payload.collections[collectionSlug]!,
          data: data as never,
          overrideAccess,
          req: createTargetReq,
          trash: includesTrashState(data),
        })
      }

      // The branch left a draft above what it published. Applied as its own write so
      // main passes through both states it genuinely went through.
      for (const [writeIndex, write] of laterWrites.entries()) {
        if (localeCodes?.length) {
          for (const locale of localeCodes) {
            const branchDoc = localizedWrites?.[writeIndex + 1]?.get(locale)

            if (!branchDoc) {
              continue
            }

            const data = stripBranchMergeData({ data: branchDoc, fields })

            await updateMainDocument({
              id: shadowID,
              data,
              draft: true,
              locale,
            })
          }
        } else {
          const data = stripBranchMergeData({ data: write.data, fields })

          await updateMainDocument({
            id: shadowID,
            data,
            draft: true,
          })
        }
      }
    }

    if (hasTransaction) {
      // Before the promotion, not after: the write below records main's first version
      // for this row, and clearing the chain afterwards could take it with it — which
      // would drop a published document out of main's own drafts list.
      await dropVersionChain()

      await payload.db.updateOne({
        id: shadowID,
        branch: false,
        collection: collectionSlug,
        data: { [branchField]: MAIN_BRANCH },
        req,
      })

      await applyCreateWrites()

      return { cleanup: () => Promise.resolve('completed'), ...sourceIdentity }
    }

    const appliedCreate = await applyBranchCreateWithoutTransaction({
      applyCreateWrites,
      branch,
      collectionSlug,
      payload,
      req,
      shadow,
      shadowID,
    })

    return { ...appliedCreate, ...sourceIdentity }
  }

  const localization = payload.config.localization
  const hasLocalizedFields = traverseForLocalizedFields(fields)
  const localeCodes = localization && hasLocalizedFields ? localization.localeCodes : undefined
  const mainRowIDsBySource: NestedRowIDMap = new Map()

  for (const write of writes) {
    if (write.trashState === 'access') {
      continue
    }

    if (write.trashState === 'apply') {
      await payload.update({
        id: docID,
        collection: collectionSlug,
        data: { deletedAt: write.data.deletedAt ?? null } as never,
        draft: false,
        overrideAccess,
        req: targetReq,
        trash: true,
      })

      continue
    }

    // With localization off there is one value per field, so the shadow row is the write.
    if (!localeCodes?.length) {
      const data = applyMappedNestedRowIDs({
        data: forMain({ collectionSlug, data: write.data, payload }),
        fields,
        mainRowIDsBySource,
        payload,
        sourceData: write.data,
      })

      const mergedData = await updateMainDocument({
        id: docID,
        data,
        // A draft-only branch edit must stay a draft on main: main's published row
        // is not what the branch changed, and publishing it would push work the
        // author never published live.
        draft: write.draft,
      })

      recordNestedRowIDs({
        fields,
        mainRowIDsBySource,
        mergedData,
        payload,
        sourceData: write.data,
      })

      continue
    }

    // One write per locale, each reading the branch's document *in* that locale.
    //
    // The shadow row cannot be written directly here. A raw row holds every locale at
    // once, in a shape that differs by adapter, and Payload has no write that takes all
    // locales together — so passing it through resolved a single locale and silently
    // dropped the branch's edits to every other one. Reading per locale through the Local
    // API is the same thing a person editing main by hand would do.
    for (const [localeIndex, locale] of localeCodes.entries()) {
      const branchDoc = await readLocalizedBranchWrite({
        branch,
        collectionSlug,
        docID,
        draft: write.draft,
        locale,
        payload,
        req,
      })

      if (!branchDoc) {
        continue
      }

      const data = applyMappedNestedRowIDs({
        data: forMain({
          collectionSlug,
          data: branchDoc,
          payload,
        }),
        fields,
        mainRowIDsBySource,
        payload,
        sourceData: branchDoc,
      })

      const mergedData = await updateMainDocument({
        id: docID,
        coalesceLatestVersion: localeIndex > 0,
        data,
        draft: write.draft,
        locale,
      })

      recordNestedRowIDs({
        fields,
        mainRowIDsBySource,
        mergedData,
        payload,
        sourceData: branchDoc,
      })
    }
  }

  return { cleanup: dropShadowRow, ...sourceIdentity }
}

const includesTrashState = (data: Record<string, unknown>): boolean =>
  Object.prototype.hasOwnProperty.call(data, 'deletedAt')

const withLocale = ({
  coalesceLatestVersion,
  locale,
  req,
}: {
  coalesceLatestVersion?: boolean
  locale: string
  req: PayloadRequest
}): PayloadRequest => {
  const isolated = isolateBranchState(req)

  isolated.locale = locale

  if (coalesceLatestVersion) {
    ;(isolated.context as Record<PropertyKey, unknown>)[coalesceLatestVersionContextKey] = true
  }

  return isolated
}

type RawCollectionVersion = {
  id: number | string
  latest?: boolean
  version?: Record<string, unknown>
} & Record<string, unknown>

const applyBranchCreateWithoutTransaction = async ({
  applyCreateWrites,
  branch,
  collectionSlug,
  payload,
  req,
  shadow,
  shadowID,
}: {
  applyCreateWrites: () => Promise<void>
  branch: string
  collectionSlug: string
  payload: Payload
  req: PayloadRequest
  shadow: Record<string, unknown>
  shadowID: number | string
}): Promise<AppliedChangeResult> => {
  const existingVersions = await readRawDocumentVersions({
    collectionSlug,
    docID: shadowID,
    payload,
    req,
  })
  const existingVersionIDs = new Set(existingVersions.map(({ id }) => String(id)))
  const existingLatestVersions = existingVersions.filter(({ latest }) => latest === true)
  let preparedVersions: RawCollectionVersion[] = []
  const reqContext = req.context as Record<PropertyKey, unknown>
  const previousSkipEnforceMaxVersions = reqContext[skipEnforceMaxVersionsContextKey]

  const recover = async (): Promise<SourceRecoveryOutcome> => {
    await restoreBranchCreatedShadow({
      branch,
      collectionSlug,
      payload,
      req,
      shadow,
      shadowID,
    })

    await deleteVersionsByID({
      collectionSlug,
      ids: preparedVersions.map(({ id }) => id),
      payload,
      req,
    })

    for (const originalVersion of existingVersions) {
      await setVersionLatest({
        collectionSlug,
        isLatest: originalVersion.latest === true,
        payload,
        req,
        version: originalVersion,
      })
    }

    return 'deleted'
  }

  try {
    for (const version of existingLatestVersions) {
      await setVersionLatest({ collectionSlug, isLatest: false, payload, req, version })
    }

    // The row keeps its branch identity while project access, hooks and validation
    // run. A rejected write therefore cannot become visible on main when the
    // adapter has no transaction support.
    reqContext[skipEnforceMaxVersionsContextKey] = { id: shadowID, collectionSlug }

    try {
      await applyCreateWrites()
    } finally {
      if (previousSkipEnforceMaxVersions === undefined) {
        delete reqContext[skipEnforceMaxVersionsContextKey]
      } else {
        reqContext[skipEnforceMaxVersionsContextKey] = previousSkipEnforceMaxVersions
      }
    }

    const versionsAfterWrite = await readRawDocumentVersions({
      collectionSlug,
      docID: shadowID,
      payload,
      req,
    })

    preparedVersions = versionsAfterWrite.filter(({ id }) => !existingVersionIDs.has(String(id)))

    for (const version of preparedVersions) {
      await promotePreparedVersion({ collectionSlug, payload, req, version })
    }

    // The document promotion is the final visibility change. Every operation that
    // can reject user data has completed before this trusted adapter write.
    await payload.db.updateOne({
      id: shadowID,
      branch: false,
      collection: collectionSlug,
      data: { [branchField]: MAIN_BRANCH },
      req,
    })
  } catch (error) {
    const versionsAfterFailure = await readRawDocumentVersions({
      collectionSlug,
      docID: shadowID,
      payload,
      req,
    })

    preparedVersions = versionsAfterFailure.filter(({ id }) => !existingVersionIDs.has(String(id)))

    await recover()

    throw error
  }

  return {
    cleanup: async () => {
      await deleteVersionsByID({
        collectionSlug,
        ids: [...existingVersionIDs],
        payload,
        req,
      })

      const collection = payload.collections[collectionSlug]!.config
      const maxVersions = getVersionsMax(collection)

      if (maxVersions > 0) {
        await enforceMaxVersions({
          id: shadowID,
          collection,
          max: maxVersions,
          payload,
          req,
        })
      }

      return 'completed'
    },
    recover,
    sourceVersionIDs: [...existingVersionIDs],
  }
}

const readRawDocumentVersions = async ({
  collectionSlug,
  docID,
  payload,
  req,
}: {
  collectionSlug: string
  docID: number | string
  payload: Payload
  req: PayloadRequest
}): Promise<RawCollectionVersion[]> => {
  if (!payload.collections[collectionSlug]?.config.versions) {
    return []
  }

  const { docs } = await payload.db.findVersions({
    branch: false,
    collection: collectionSlug,
    limit: 0,
    pagination: false,
    req,
    where: { parent: { equals: docID } },
  })

  return docs as RawCollectionVersion[]
}

const setVersionLatest = async ({
  collectionSlug,
  isLatest,
  payload,
  req,
  version,
}: {
  collectionSlug: string
  isLatest: boolean
  payload: Payload
  req: PayloadRequest
  version: RawCollectionVersion
}): Promise<void> => {
  await payload.db.updateVersion({
    id: version.id,
    collection: collectionSlug,
    req,
    versionData: {
      latest: isLatest,
      version: version.version ?? {},
    },
  })
}

const promotePreparedVersion = async ({
  collectionSlug,
  payload,
  req,
  version,
}: {
  collectionSlug: string
  payload: Payload
  req: PayloadRequest
  version: RawCollectionVersion
}): Promise<void> => {
  const documentVersion =
    version.version && typeof version.version === 'object' ? version.version : {}

  await payload.db.updateVersion({
    id: version.id,
    collection: collectionSlug,
    req,
    versionData: {
      [branchField]: MAIN_BRANCH,
      [branchParentField]: null,
      version: {
        ...documentVersion,
        [branchField]: MAIN_BRANCH,
      },
    } as never,
  })
}

export const deleteVersionsByID = async ({
  collectionSlug,
  ids,
  payload,
  req,
}: {
  collectionSlug: string
  ids: (number | string)[]
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  if (!ids.length) {
    return
  }

  await payload.db.deleteVersions({
    collection: collectionSlug,
    req,
    where: { id: { in: ids } },
  })
}

const restoreBranchCreatedShadow = async ({
  branch,
  collectionSlug,
  payload,
  req,
  shadow,
  shadowID,
}: {
  branch: string
  collectionSlug: string
  payload: Payload
  req: PayloadRequest
  shadow: Record<string, unknown>
  shadowID: number | string
}): Promise<void> => {
  const { id: _id, ...originalData } = shadow

  await payload.db.updateOne({
    id: shadowID,
    branch: false,
    collection: collectionSlug,
    data: {
      ...originalData,
      [branchField]: branch,
    },
    req,
  })
}

/** Applies the latest stored state of a branch global to main. */
export const applyGlobalChange = async ({
  branch,
  globalSlug,
  overrideAccess,
  payload,
  req,
  targetReq,
}: {
  branch: string
  globalSlug: string
  overrideAccess: boolean
  payload: Payload
  req: PayloadRequest
  targetReq: PayloadRequest
}): Promise<AppliedChangeResult> => {
  const writes = await resolveGlobalMergeWrites({ branch, globalSlug, payload, req })

  if (!writes.length) {
    throw new Error(`Branch "${branch}" has no stored copy of global "${globalSlug}" to merge.`)
  }

  if (!payload.db.deleteBranchGlobal) {
    throw new Error(
      `The database adapter cannot remove a branch's copy of a global, so "${globalSlug}" cannot be merged.`,
    )
  }

  const globalConfig = payload.globals.config.find(({ slug }) => slug === globalSlug)

  if (!globalConfig) {
    throw new Error(`Global "${globalSlug}" is not configured.`)
  }

  const locales = getGlobalMergeLocales({ globalSlug, payload, req })
  const appliedSourceStates: {
    data: string
    draft: boolean
    locale: string
  }[] = []

  for (const write of writes) {
    for (const [localeIndex, locale] of locales.entries()) {
      const data = await readBranchGlobalWrite({
        branch,
        draft: write.draft,
        globalSlug,
        locale,
        payload,
        req,
      })

      if (!data) {
        throw new Error(
          `Branch "${branch}" has no stored ${write.draft ? 'draft' : 'published'} state of global "${globalSlug}" to merge.`,
        )
      }

      appliedSourceStates.push({ data: JSON.stringify(data), draft: write.draft, locale })

      await payload.updateGlobal({
        slug: globalSlug,
        data: stripBranchMergeGlobalData({ data, fields: globalConfig.fields }) as never,
        draft: write.draft,
        locale,
        overrideAccess,
        req: withLocale({
          coalesceLatestVersion: localeIndex > 0,
          locale,
          req: targetReq,
        }),
      })
    }
  }

  return {
    cleanup: async () => {
      for (const sourceState of appliedSourceStates) {
        const currentData = await readBranchGlobalWrite({
          branch,
          draft: sourceState.draft,
          globalSlug,
          locale: sourceState.locale,
          payload,
          req,
        })

        if (currentData && JSON.stringify(currentData) !== sourceState.data) {
          return 'superseded'
        }
      }

      await deleteBranchGlobalVersionChain({ branch, globalSlug, payload, req })
      await payload.db.deleteBranchGlobal!({ branch, globalSlug, req })

      return 'completed'
    },
    sourceRevision: getGlobalSourceRevision({ sourceStates: appliedSourceStates }),
  }
}
