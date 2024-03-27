import type { LivePreviewConfig, ServerOnlyLivePreviewProperties } from '../../config/types.js'

export type ServerOnlyCollectionProperties = keyof Pick<
  SanitizedCollectionConfig,
  'access' | 'endpoints' | 'hooks'
>

export type ServerOnlyCollectionAdminProperties = keyof Pick<
  SanitizedCollectionConfig['admin'],
  'components' | 'hidden' | 'preview'
>

export type ClientCollectionConfig = Omit<
  SanitizedCollectionConfig,
  'admin' | 'fields' | ServerOnlyCollectionProperties
> & {
  admin: Omit<
    SanitizedCollectionConfig['admin'],
    ServerOnlyCollectionAdminProperties & 'fields' & 'livePreview'
  > & {
    livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>
  }
  fields: ClientFieldConfig[]
}

import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { SanitizedCollectionConfig } from './types.js'

import { createClientFieldConfigs } from '../../fields/config/client.js'

export const createClientCollectionConfig = (collection: SanitizedCollectionConfig) => {
  const sanitized = { ...collection }
  sanitized.fields = createClientFieldConfigs(sanitized.fields)

  const serverOnlyCollectionProperties: Partial<ServerOnlyCollectionProperties>[] = [
    'hooks',
    'access',
    'endpoints',
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
  }

  if ('auth' in sanitized && typeof sanitized.auth === 'object') {
    sanitized.auth = { ...sanitized.auth }
    delete sanitized.auth.strategies
    delete sanitized.auth.forgotPassword
    delete sanitized.auth.verify
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

export const createClientCollectionConfigs = (
  collections: SanitizedCollectionConfig[],
): ClientCollectionConfig[] =>
  collections.map((collection) => createClientCollectionConfig(collection))
