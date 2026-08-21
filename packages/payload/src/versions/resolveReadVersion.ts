import { status as httpStatus } from 'http-status'

import type { ReadVersion } from './types.js'

import { APIError } from '../errors/APIError.js'

export type ResolveReadVersionArgs = {
  draftsEnabled: boolean
  version?: unknown
}

/**
 * Normalizes a public read `version` value.
 *
 * Omission becomes `published`. On entities without drafts, `latest` maps to `published`
 * while `draft` stays draft-only so the operation can return no result.
 */
export function resolveReadVersion({
  draftsEnabled,
  version,
}: ResolveReadVersionArgs): ReadVersion {
  if (version === undefined || version === null) {
    return 'published'
  }

  const parsed = parseReadVersion(version)

  if (!draftsEnabled && parsed === 'latest') {
    return 'published'
  }

  return parsed
}

function parseReadVersion(version: unknown): ReadVersion {
  if (typeof version === 'string') {
    switch (version) {
      case 'draft':
      case 'latest':
      case 'published':
        return version
      default:
        throw invalidReadVersion(version)
    }
  }

  throw invalidReadVersion(version)
}

function invalidReadVersion(version: unknown): APIError {
  return new APIError(
    `Invalid version ${JSON.stringify(version)}. Valid values are: published, latest, draft.`,
    httpStatus.BAD_REQUEST,
  )
}
