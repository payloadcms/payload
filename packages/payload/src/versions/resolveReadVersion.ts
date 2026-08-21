import { status as httpStatus } from 'http-status'

import type { ReadVersion } from './types.js'

import { APIError } from '../errors/APIError.js'

export type ResolveReadVersionArgs = {
  draftsEnabled: boolean
  version?: unknown
}

export type ResolveOperationReadVersionArgs = {
  /**
   * Internal boolean still passed by REST/GraphQL until those layers are converted.
   */
  draft?: boolean
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

/**
 * True when the read should come from version storage rather than published main documents.
 */
export function isVersionedRead(version: ReadVersion): boolean {
  return version === 'draft' || version === 'latest'
}

/**
 * Resolves a read version from public `version`, with an internal `draft` fallback for
 * REST and GraphQL callers that have not been converted yet.
 */
export function resolveOperationReadVersion({
  draft,
  draftsEnabled,
  version,
}: ResolveOperationReadVersionArgs): ReadVersion {
  if (version !== undefined && version !== null) {
    return resolveReadVersion({ draftsEnabled, version })
  }

  if (draft === true) {
    return resolveReadVersion({ draftsEnabled, version: 'latest' })
  }

  return 'published'
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
