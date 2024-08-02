import type { TFunction } from '@payloadcms/translations'
import type {
  ClientFieldConfig,
  LivePreviewConfig,
  SanitizedCollectionConfig,
  ServerOnlyLivePreviewProperties,
} from 'payload'

import { createClientFieldConfigs } from './fields.js'

export type ServerOnlyCollectionProperties = keyof Pick<
  SanitizedCollectionConfig,
  'access' | 'custom' | 'endpoints' | 'hooks'
>

export type ServerOnlyCollectionAdminProperties = keyof Pick<
  SanitizedCollectionConfig['admin'],
  'components' | 'hidden' | 'preview'
>

export type ClientCollectionConfig = {
  admin: {
    livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>
  } & Omit<
    SanitizedCollectionConfig['admin'],
    'fields' | 'livePreview' | ServerOnlyCollectionAdminProperties
  >
  fields: ClientFieldConfig[]
} & Omit<SanitizedCollectionConfig, 'admin' | 'fields' | ServerOnlyCollectionProperties>

export const createClientCollectionConfig = ({
  collection,
  t,
}: {
  collection: SanitizedCollectionConfig
  t: TFunction
}): SanitizedCollectionConfig => {
  const sanitized = { ...collection }
  sanitized.fields = createClientFieldConfigs({ fields: sanitized.fields, t })

  const serverOnlyCollectionProperties: Partial<ServerOnlyCollectionProperties>[] = [
    'hooks',
    'access',
    'endpoints',
    'custom',
    // `upload`
    // `admin`
    // are all handled separately
  ]

  serverOnlyCollectionProperties.forEach((key) => {
    if (key in sanitized) {
      delete sanitized[key]
    }
  })

  if ('upload' in sanitized && typeof sanitized.upload === 'object') {
    sanitized.upload = { ...sanitized.upload }
    delete sanitized.upload.handlers
    delete sanitized.upload.adminThumbnail
    delete sanitized.upload.externalFileHeaderFilter
    delete sanitized.upload.withMetadata
  }

  if ('auth' in sanitized && typeof sanitized.auth === 'object') {
    sanitized.auth = { ...sanitized.auth }
    delete sanitized.auth.strategies
    delete sanitized.auth.forgotPassword
    delete sanitized.auth.verify
  }

  if (sanitized.labels) {
    Object.entries(sanitized.labels).forEach(([labelType, collectionLabel]) => {
      if (typeof collectionLabel === 'function') {
        sanitized.labels[labelType] = collectionLabel({ t })
      }
    })
  }

  if ('admin' in sanitized) {
    sanitized.admin = { ...sanitized.admin }

    const serverOnlyCollectionAdminProperties: Partial<ServerOnlyCollectionAdminProperties>[] = [
      'components',
      'hidden',
      'preview',
      // `livePreview` is handled separately
    ]

    serverOnlyCollectionAdminProperties.forEach((key) => {
      if (key in sanitized.admin) {
        delete sanitized.admin[key]
      }
    })

    if ('livePreview' in sanitized.admin) {
      sanitized.admin.livePreview = { ...sanitized.admin.livePreview }
      delete sanitized.admin.livePreview.url
    }
  }

  return sanitized
}

export const createClientCollectionConfigs = ({
  collections,
  t,
}: {
  collections: SanitizedCollectionConfig[]
  t: TFunction
}): ClientCollectionConfig[] =>
  collections.map((collection) => createClientCollectionConfig({ collection, t }))
