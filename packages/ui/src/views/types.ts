import type { I18nClient } from '@payloadcms/translations'
import type {
  EditConfig,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import type { ViewMetadata } from '../utilities/meta.js'

export type GenerateViewMetadata = (args: {
  config: SanitizedConfig
  i18n: I18nClient
  isEditing?: boolean
  params?: { [key: string]: string | string[] }
}) => Promise<ViewMetadata>

export type GenerateEditViewMetadata = (
  args: {
    collectionConfig?: null | SanitizedCollectionConfig
    globalConfig?: null | SanitizedGlobalConfig
    isReadOnly?: boolean
    view?: keyof EditConfig
  } & Parameters<GenerateViewMetadata>[0],
) => Promise<ViewMetadata>
