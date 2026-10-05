import type { DocumentVersion } from '../types/operations.js'

import { APIError } from '../errors/APIError.js'

/** Validates public document selectors before an operation runs. */
export function parseDocumentVersion(args: {
  isCreate: true
  params: Record<string, unknown>
}): Exclude<DocumentVersion, 'latest'> | undefined
export function parseDocumentVersion(args: {
  isCreate?: false
  params: Record<string, unknown>
}): DocumentVersion | undefined
export function parseDocumentVersion({
  isCreate = false,
  params,
}: {
  isCreate?: boolean
  params: Record<string, unknown>
}): DocumentVersion | undefined {
  for (const key of ['draft', 'publishAllLocales', 'unpublishAllLocales']) {
    if (key in params) {
      throw new APIError(
        `The "${key}" parameter has been removed. Use "version" and "locale" instead.`,
        400,
      )
    }
  }

  const { version } = params

  if (version === undefined) {
    return undefined
  }

  if (version === 'published' || version === 'draft' || (!isCreate && version === 'latest')) {
    return version
  }

  throw new APIError(
    `Invalid version. Expected ${isCreate ? '"published" or "draft"' : '"published", "draft", or "latest"'}.`,
    400,
  )
}
