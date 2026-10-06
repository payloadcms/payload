import type { JsonObject } from '../../../types/index.js'
import type { DocumentVersion } from '../../../types/operations.js'
import type { SanitizedCollectionConfig } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { hasDraftsEnabled } from '../../../utilities/getVersionsConfig.js'

export const resolveCreateVersion = ({
  collectionConfig,
  data,
  version,
}: {
  collectionConfig: SanitizedCollectionConfig
  data: JsonObject
  version?: Exclude<DocumentVersion, 'latest'>
}): 'draft' | 'published' => {
  if (version && version !== 'draft' && version !== 'published') {
    throw new APIError(`Invalid create version selector: ${String(version)}.`, 400)
  }

  validateWriteVersion({ collectionConfig, version })

  const resolvedVersion = hasDraftsEnabled(collectionConfig)
    ? (version ?? (data._status === 'published' ? 'published' : 'draft'))
    : 'published'

  return resolvedVersion
}

export const isDraftVersion = ({
  doc,
  locale,
}: {
  doc: JsonObject
  locale?: null | string
}): boolean => {
  if (doc._status === 'draft') {
    return true
  }

  return Boolean(
    doc._status &&
      typeof doc._status === 'object' &&
      (locale && locale !== 'all'
        ? doc._status[locale] === 'draft'
        : Object.values(doc._status).some((status) => status === 'draft')),
  )
}

export const validateWriteVersion = ({
  collectionConfig,
  version,
}: {
  collectionConfig: SanitizedCollectionConfig
  version?: DocumentVersion
}): void => {
  if (version && !['draft', 'latest', 'published'].includes(version)) {
    throw new APIError(`Invalid version selector: ${String(version)}.`, 400)
  }

  if (version === 'draft' && !hasDraftsEnabled(collectionConfig)) {
    throw new APIError(`Drafts are not enabled for collection ${collectionConfig.slug}.`, 400)
  }
}
