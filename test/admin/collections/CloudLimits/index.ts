import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { APIError } from 'payload'

import { cloudLimitsAutosaveCollectionSlug, cloudLimitsCollectionSlug } from '../../slugs.js'

/**
 * Content API "cloud limit" enforcement errors, keyed by the title that triggers them. Saving a
 * document whose title matches one of these throws the corresponding `APIError` from a
 * `beforeChange` hook, so the admin UI (document-count modal, and toasts for data-size and
 * asset-storage) can be exercised in e2e without the real Content API backend.
 *
 * The `code`/`status`/`message` shape mirrors what the Content API returns: `APIError`'s `data`
 * is serialized to `json.errors[i].data`, so the limit `code` reaches the client at
 * `json.errors[i].data.code` — the path the UI keys off.
 */
export const cloudLimitTriggers = {
  assetStorage: {
    code: 'cloud_limit.cms_assets_bytes_exceeded',
    message: 'Content system has exceeded its CMS asset storage limit.',
    status: 409,
    title: '__ASSET__',
  },
  documentCount: {
    code: 'cloud_limit.document_count_exceeded',
    message: 'Content system has reached its maximum document count of 100.',
    status: 409,
    title: '__DOC_LIMIT__',
  },
  documentDataSize: {
    code: 'cloud_limit.per_document_data_bytes_exceeded',
    message: 'Document data size 5134 bytes exceeds the maximum of 2000 bytes.',
    status: 413,
    title: '__DATA_SIZE__',
  },
} as const

const triggerByTitle = Object.fromEntries(
  Object.values(cloudLimitTriggers).map((trigger) => [trigger.title, trigger]),
)

const throwCloudLimitError: CollectionBeforeChangeHook = ({ data }) => {
  const trigger = typeof data?.title === 'string' ? triggerByTitle[data.title] : undefined

  if (trigger) {
    throw new APIError(trigger.message, trigger.status, { code: trigger.code })
  }

  return data
}

export const CloudLimits: CollectionConfig = {
  slug: cloudLimitsCollectionSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  hooks: {
    beforeChange: [throwCloudLimitError],
  },
}

export const CloudLimitsAutosave: CollectionConfig = {
  slug: cloudLimitsAutosaveCollectionSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  hooks: {
    beforeChange: [throwCloudLimitError],
  },
  versions: {
    drafts: {
      autosave: true,
    },
  },
}
