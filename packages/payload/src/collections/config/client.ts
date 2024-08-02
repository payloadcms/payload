import type { SanitizedCollectionConfig } from './types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'
import type { LivePreviewConfig, ServerOnlyLivePreviewProperties } from '../../config/types.js'

export type ServerOnlyCollectionProperties = keyof Pick<
  SanitizedCollectionConfig,
  'access' | 'custom' | 'endpoints' | 'hooks'
>

export type ServerOnlyCollectionAdminProperties = keyof Pick<
  SanitizedCollectionConfig['admin'],
  'hidden' | 'preview'
>

export type ClientCollectionConfig = {
  admin: {
    livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>
  } & Omit<SanitizedCollectionConfig['admin'], 'livePreview' | ServerOnlyCollectionAdminProperties>
  fields: ClientFieldConfig[]
} & Omit<SanitizedCollectionConfig, 'admin' | 'fields' | ServerOnlyCollectionProperties>
