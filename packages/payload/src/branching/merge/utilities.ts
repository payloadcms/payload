import { createHash } from 'node:crypto'

import type { Payload, PayloadRequest } from '../../types/index.js'

import { extractRelationshipID } from '../../utilities/extractRelationshipID.js'
import {
  getGlobalMergeLocales,
  readBranchGlobalWrite,
  resolveGlobalMergeWrites,
} from '../globalMergeWrites.js'

export type SourceCleanupOutcome = 'completed' | 'superseded'
export type SourceRecoveryOutcome = 'deleted' | 'restored'

export type AppliedChangeResult = {
  cleanup: () => Promise<SourceCleanupOutcome>
  recover?: () => Promise<SourceRecoveryOutcome>
  sourceID?: string
  sourceRevision?: string
  sourceUpdatedAt?: string
  sourceVersionIDs?: (number | string)[]
}

export type SerializedGlobalSourceState = {
  data: string
  draft: boolean
  locale: string
}

export const changeDocID = ({ doc }: { doc?: unknown }): number | string =>
  extractRelationshipID({ relationship: doc }) as number | string

export const getMergeErrorMessage = ({ error }: { error: unknown }): string =>
  error instanceof Error ? error.message : String(error)

export const getTimestamp = ({ value }: { value: unknown }): number | undefined => {
  if (value instanceof Date) {
    return value.getTime()
  }

  if (typeof value !== 'number' && typeof value !== 'string') {
    return undefined
  }

  const timestamp = new Date(value).getTime()

  return Number.isNaN(timestamp) ? undefined : timestamp
}

export const getGlobalSourceRevision = ({
  sourceStates,
}: {
  sourceStates: SerializedGlobalSourceState[]
}): string => createHash('sha256').update(JSON.stringify(sourceStates)).digest('hex')

export const readSerializedGlobalSourceStates = async ({
  branch,
  globalSlug,
  payload,
  req,
}: {
  branch: string
  globalSlug: string
  payload: Payload
  req: PayloadRequest
}): Promise<SerializedGlobalSourceState[]> => {
  const writes = await resolveGlobalMergeWrites({ branch, globalSlug, payload, req })
  const locales = getGlobalMergeLocales({ globalSlug, payload, req })
  const sourceStates: SerializedGlobalSourceState[] = []

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
        sourceStates.push({ data: JSON.stringify(data), draft: write.draft, locale })
      }
    }
  }

  return sourceStates
}
