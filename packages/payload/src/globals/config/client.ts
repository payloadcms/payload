import type { I18nClient } from '@payloadcms/translations'

import type {
  LivePreviewConfig,
  SanitizedConfig,
  ServerOnlyLivePreviewProperties,
} from '../../config/types.js'
import type { Payload } from '../../types/index.js'
import type { SanitizedGlobalConfig } from './types.js'

import { type ClientField, createClientFields } from '../../fields/config/client.js'
import { deepCopyObjectSimple } from '../../utilities/deepCopyObject.js'

export type ServerOnlyGlobalProperties = keyof Pick<
  SanitizedGlobalConfig,
  'access' | 'admin' | 'custom' | 'endpoints' | 'fields' | 'hooks'
>
export type ServerOnlyGlobalAdminProperties = keyof Pick<
  SanitizedGlobalConfig['admin'],
  'hidden' | 'preview'
>

export type ClientGlobalConfig = {
  _isPreviewEnabled?: true
  admin: {
    components: null
    livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>
  } & Omit<
    SanitizedGlobalConfig['admin'],
    'components' | 'livePreview' | ServerOnlyGlobalAdminProperties
  >
  fields: ClientField[]
} & Omit<SanitizedGlobalConfig, 'admin' | 'fields' | ServerOnlyGlobalProperties>

export const createClientGlobalConfig = ({
  defaultIDType,
  global,
  i18n,
}: {
  defaultIDType: Payload['config']['db']['defaultIDType']
  global: SanitizedConfig['globals'][0]
  i18n: I18nClient
}): ClientGlobalConfig => {
  const clientGlobal = deepCopyObjectSimple(global) as unknown as ClientGlobalConfig

  clientGlobal.fields = createClientFields({
    clientFields: clientGlobal?.fields || [],
    defaultIDType,
    fields: global.fields,
    i18n,
  })

  const serverOnlyProperties: Partial<ServerOnlyGlobalProperties>[] = [
    'hooks',
    'access',
    'endpoints',
    'custom',
    // `admin` is handled separately
  ]

  serverOnlyProperties.forEach((key) => {
    if (key in clientGlobal) {
      delete clientGlobal[key]
    }
  })

  if (global.admin.preview) {
    clientGlobal._isPreviewEnabled = true
  }

  if (!clientGlobal.admin) {
    clientGlobal.admin = {} as ClientGlobalConfig['admin']
  }

  const serverOnlyGlobalAdminProperties: Partial<ServerOnlyGlobalAdminProperties>[] = [
    'hidden',
    'preview',
  ]

  serverOnlyGlobalAdminProperties.forEach((key) => {
    if (key in clientGlobal.admin) {
      delete clientGlobal.admin[key]
    }
  })

  clientGlobal.admin.components = null

  if (
    'livePreview' in clientGlobal.admin &&
    clientGlobal.admin.livePreview &&
    'url' in clientGlobal.admin.livePreview
  ) {
    delete clientGlobal.admin.livePreview.url
  }

  return clientGlobal
}

export const createClientGlobalConfigs = ({
  defaultIDType,
  globals,
  i18n,
}: {
  defaultIDType: Payload['config']['db']['defaultIDType']
  globals: SanitizedConfig['globals']
  i18n: I18nClient
}): ClientGlobalConfig[] => {
  const clientGlobals = new Array(globals.length)

  for (let i = 0; i < globals.length; i++) {
    const global = globals[i]

    clientGlobals[i] = createClientGlobalConfig({
      defaultIDType,
      global,
      i18n,
    })
  }

  return clientGlobals
}
