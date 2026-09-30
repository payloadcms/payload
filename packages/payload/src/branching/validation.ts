import type { Field } from '../fields/config/types.js'
import type { Payload, PayloadRequest } from '../types/index.js'
import type { EffectiveOperation, ResolvedChange } from './effectiveOperations.js'

import { ValidationError } from '../errors/ValidationError.js'
import { fieldIsVirtual, tabHasName } from '../fields/config/types.js'
import {
  validateCollectionData,
  validateGlobalData,
} from '../utilities/entityInputSchema/validateEntityData.js'
import { traverseForLocalizedFields } from '../utilities/traverseForLocalizedFields.js'
import {
  getGlobalMergeLocales,
  readBranchGlobalWrite,
  resolveGlobalMergeWrites,
} from './globalMergeWrites.js'
import { readLocalizedBranchWrite } from './readLocalizedBranchWrite.js'
import { isolateBranchState } from './resolveBranch.js'
import { branchDocIDField, branchField, MAIN_BRANCH } from './types.js'

export type BranchMergeValidationCandidate = {
  changeID: number | string
  collectionSlug?: string
  data?: Record<string, unknown>
  docID?: number | string
  draft: boolean
  entityType: 'collection' | 'global'
  globalSlug?: string
  locale?: string
  operation: EffectiveOperation
}

export type BranchMergeValidationError = {
  changeID: number | string
  collectionSlug?: string
  docID?: number | string
  globalSlug?: string
  locale?: string
  message: string
  path?: string
}

export type BranchMergeValidationResult = {
  errors: BranchMergeValidationError[]
  valid: boolean
}

export type BranchMergeValidate = (args: {
  branch: string
  candidates: BranchMergeValidationCandidate[]
  req: PayloadRequest
  target: 'main'
}) => BranchMergeValidationResult | Promise<BranchMergeValidationResult>

export const createMainBranchRequest = ({ req }: { req: PayloadRequest }): PayloadRequest => {
  const targetReq = isolateBranchState(req)

  targetReq.branch = MAIN_BRANCH
  targetReq.query = { ...targetReq.query }
  delete targetReq.query.branch
  delete (targetReq.context as Record<string, unknown>)._branchBypass

  return targetReq
}

export const prepareBranchMergeValidationCandidates = async ({
  payload,
  pending,
  pendingGlobals,
  req,
}: {
  payload: Payload
  pending: ResolvedChange[]
  pendingGlobals: Record<string, unknown>[]
  req: PayloadRequest
}): Promise<BranchMergeValidationCandidate[]> => {
  const candidates: BranchMergeValidationCandidate[] = []

  for (const resolved of pending) {
    const collectionConfig = payload.collections[resolved.collectionSlug]!.config
    const localization = payload.config.localization
    const locales =
      localization && traverseForLocalizedFields(collectionConfig.fields)
        ? localization.localeCodes
        : undefined

    for (const write of resolved.writes) {
      const baseCandidate = {
        changeID: resolved.change.id as number | string,
        collectionSlug: resolved.collectionSlug,
        docID: resolved.docID,
        draft: write.draft,
        entityType: 'collection' as const,
        operation: write.operation,
      }

      if (write.operation === 'delete' || !locales?.length) {
        candidates.push({
          ...baseCandidate,
          data:
            write.operation === 'delete'
              ? undefined
              : prepareCollectionCandidate({
                  collectionSlug: resolved.collectionSlug,
                  data: write.data,
                  payload,
                }),
        })
        continue
      }

      for (const locale of locales) {
        const data = await readLocalizedBranchWrite({
          branch: resolved.change.branch as string,
          collectionSlug: resolved.collectionSlug,
          docID: resolved.docID,
          draft: write.draft,
          locale,
          payload,
          req,
        })

        if (data) {
          candidates.push({
            ...baseCandidate,
            data: prepareCollectionCandidate({
              collectionSlug: resolved.collectionSlug,
              data,
              payload,
            }),
            locale,
          })
        }
      }
    }
  }

  for (const change of pendingGlobals) {
    const branch = change.branch as string
    const globalSlug = change.globalSlug as string
    const writes = await resolveGlobalMergeWrites({ branch, globalSlug, payload, req })
    const locales = getGlobalMergeLocales({ globalSlug, payload, req })

    for (const write of writes) {
      for (const locale of locales) {
        const data = await readBranchGlobalWrite({
          branch,
          draft: write.draft,
          globalSlug,
          locale,
          payload,
          req,
        })

        if (data) {
          candidates.push({
            changeID: change.id as number | string,
            data: stripNonWritableFields({
              data: stripGlobalInternal(data),
              fields: payload.globals.config.find(({ slug }) => slug === globalSlug)!.fields,
              payload,
            }),
            draft: write.draft,
            entityType: 'global',
            globalSlug,
            locale,
            operation: 'update',
          })
        }
      }
    }
  }

  return candidates
}

/** Best-effort structural validation for the exact candidates selected by merge. */
export const defaultBranchMergeValidation: BranchMergeValidate = ({ candidates, req }) => {
  const errors: BranchMergeValidationError[] = []

  for (const candidate of candidates) {
    if (!candidate.data || candidate.operation === 'delete') {
      continue
    }

    const candidateReq = isolateBranchState(req)

    if (candidate.locale) {
      candidateReq.locale = candidate.locale
    }

    try {
      if (candidate.entityType === 'collection' && candidate.collectionSlug) {
        validateCollectionData({
          slug: candidate.collectionSlug as never,
          data: candidate.data,
          partial: candidate.operation !== 'create',
          req: candidateReq,
        })
      } else if (candidate.entityType === 'global' && candidate.globalSlug) {
        validateGlobalData({
          slug: candidate.globalSlug as never,
          data: candidate.data,
          req: candidateReq,
        })
      }
    } catch (error) {
      if (!(error instanceof ValidationError)) {
        throw error
      }

      for (const fieldError of error.data.errors) {
        errors.push({
          changeID: candidate.changeID,
          collectionSlug: candidate.collectionSlug,
          docID: candidate.docID,
          globalSlug: candidate.globalSlug,
          locale: candidate.locale,
          message: fieldError.message,
          path: fieldError.path,
        })
      }
    }
  }

  return { errors, valid: errors.length === 0 }
}

const stripInternal = (data: Record<string, unknown>): Record<string, unknown> => {
  const {
    id: _id,
    [branchDocIDField]: _docID,
    [branchField]: _branch,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data

  return rest
}

const stripGlobalInternal = (data: Record<string, unknown>): Record<string, unknown> => {
  const { globalType: _globalType, ...globalData } = data

  return stripInternal(globalData)
}

const prepareCollectionCandidate = ({
  collectionSlug,
  data,
  payload,
}: {
  collectionSlug: string
  data: Record<string, unknown>
  payload: Payload
}): Record<string, unknown> =>
  stripNonWritableFields({
    data: stripInternal(data),
    fields: payload.collections[collectionSlug]!.config.fields,
    payload,
  })

const stripNonWritableFields = ({
  data,
  fields,
  payload,
}: {
  data: Record<string, unknown>
  fields: Field[]
  payload: Payload
}): Record<string, unknown> => {
  let writableData = { ...data }

  for (const field of fields) {
    if ('name' in field && field.name && (field.type === 'join' || fieldIsVirtual(field))) {
      delete writableData[field.name]
      continue
    }

    if (field.type === 'row' || field.type === 'collapsible') {
      writableData = stripNonWritableFields({ data: writableData, fields: field.fields, payload })
      continue
    }

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if (!tabHasName(tab)) {
          writableData = stripNonWritableFields({ data: writableData, fields: tab.fields, payload })
          continue
        }

        const tabData = writableData[tab.name]

        if (isRecord(tabData)) {
          writableData[tab.name] = stripNonWritableFields({
            data: tabData,
            fields: tab.fields,
            payload,
          })
        }
      }

      continue
    }

    if (field.type === 'group') {
      if (!('name' in field) || !field.name) {
        writableData = stripNonWritableFields({ data: writableData, fields: field.fields, payload })
        continue
      }

      const groupData = writableData[field.name]

      if (isRecord(groupData)) {
        writableData[field.name] = stripNonWritableFields({
          data: groupData,
          fields: field.fields,
          payload,
        })
      }

      continue
    }

    if (field.type === 'array' && field.name) {
      const rows = writableData[field.name]

      if (Array.isArray(rows)) {
        writableData[field.name] = rows.map((row) =>
          isRecord(row)
            ? stripNonWritableFields({ data: row, fields: field.fields, payload })
            : row,
        )
      }

      continue
    }

    if (field.type === 'blocks' && field.name) {
      const rows = writableData[field.name]

      if (Array.isArray(rows)) {
        writableData[field.name] = rows.map((row) => {
          if (!isRecord(row) || typeof row.blockType !== 'string') {
            return row
          }

          const block =
            payload.config.blocks?.find(({ slug }) => slug === row.blockType) ??
            field.blocks.find(
              (candidate) => typeof candidate !== 'string' && candidate.slug === row.blockType,
            )

          return !block || typeof block === 'string'
            ? row
            : stripNonWritableFields({ data: row, fields: block.fields, payload })
        })
      }
    }
  }

  return writableData
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value))
