import type { TFunction } from '@payloadcms/translations'
import type {
  ClientFieldConfig,
  LivePreviewConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
  ServerOnlyLivePreviewProperties,
} from 'payload'

import { createClientFieldConfigs } from './fields.js'

export type ServerOnlyGlobalProperties = keyof Pick<
  SanitizedGlobalConfig,
  'access' | 'admin' | 'custom' | 'endpoints' | 'fields' | 'hooks'
>
export type ServerOnlyGlobalAdminProperties = keyof Pick<
  SanitizedGlobalConfig['admin'],
  'components' | 'hidden' | 'preview'
>

export type ClientGlobalConfig = {
  admin: {
    livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>
  } & Omit<
    SanitizedGlobalConfig['admin'],
    'fields' & 'livePreview' & ServerOnlyGlobalAdminProperties
  >
  fields: ClientFieldConfig[]
} & Omit<SanitizedGlobalConfig, 'admin' | 'fields' | ServerOnlyGlobalProperties>

export const createClientGlobalConfig = ({
  global,
  t,
}: {
  global: SanitizedConfig['globals'][0]
  t: TFunction
}): ClientGlobalConfig => {
  const sanitized = { ...global }
  sanitized.fields = createClientFieldConfigs({ fields: sanitized.fields, t })

  const serverOnlyProperties: Partial<ServerOnlyGlobalProperties>[] = [
    'hooks',
    'access',
    'endpoints',
    'custom',
    // `admin` is handled separately
  ]

  serverOnlyProperties.forEach((key) => {
    if (key in sanitized) {
      delete sanitized[key]
    }
  })

  if ('admin' in sanitized) {
    sanitized.admin = { ...sanitized.admin }

    const serverOnlyGlobalAdminProperties: Partial<ServerOnlyGlobalAdminProperties>[] = [
      'components',
      'hidden',
      'preview',
    ]

    serverOnlyGlobalAdminProperties.forEach((key) => {
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

export const createClientGlobalConfigs = ({
  globals,
  t,
}: {
  globals: SanitizedConfig['globals']
  t: TFunction
}): ClientGlobalConfig[] => globals.map((global) => createClientGlobalConfig({ global, t }))
