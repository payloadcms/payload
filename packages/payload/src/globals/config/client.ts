import type { I18nClient } from '@payloadcms/translations'

import type { ImportMap } from '../../bin/generateImportMap/index.js'
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

export type ServerOnlyGlobalAdminProperties = keyof Pick<SanitizedGlobalConfig['admin'], 'hidden'>

export type ClientGlobalConfig = {
  admin: {
    components: null
    livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>
    preview?: boolean
  } & Omit<
    SanitizedGlobalConfig['admin'],
    'components' | 'livePreview' | 'preview' | ServerOnlyGlobalAdminProperties
  >
  fields: ClientField[]
} & Omit<SanitizedGlobalConfig, 'admin' | 'fields' | ServerOnlyGlobalProperties>

const serverOnlyProperties: Partial<ServerOnlyGlobalProperties>[] = [
  'hooks',
  'access',
  'endpoints',
  'custom',
  // `admin` is handled separately
]

const serverOnlyGlobalAdminProperties: Partial<ServerOnlyGlobalAdminProperties>[] = ['hidden']

export const createClientGlobalConfig = ({
  defaultIDType,
  global,
  i18n,
  importMap,
}: {
  defaultIDType: Payload['config']['db']['defaultIDType']
  global: SanitizedConfig['globals'][0]
  i18n: I18nClient
  importMap: ImportMap
}): ClientGlobalConfig => {
  const clientGlobal = deepCopyObjectSimple(global, true) as unknown as ClientGlobalConfig

  clientGlobal.fields = createClientFields({
    clientFields: clientGlobal?.fields || [],
    defaultIDType,
    fields: global.fields,
    i18n,
    importMap,
  })

  serverOnlyProperties.forEach((key) => {
    if (key in clientGlobal) {
      delete clientGlobal[key]
    }
  })

  if (!clientGlobal.admin) {
    clientGlobal.admin = {} as ClientGlobalConfig['admin']
  }

  serverOnlyGlobalAdminProperties.forEach((key) => {
    if (key in clientGlobal.admin) {
      delete clientGlobal.admin[key]
    }
  })

  if (global.admin.preview) {
    clientGlobal.admin.preview = true
  }

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
  importMap,
}: {
  defaultIDType: Payload['config']['db']['defaultIDType']
  globals: SanitizedConfig['globals']
  i18n: I18nClient
  importMap: ImportMap
}): ClientGlobalConfig[] => {
  const clientGlobals = new Array(globals.length)

  for (let i = 0; i < globals.length; i++) {
    const global = globals[i]

    clientGlobals[i] = createClientGlobalConfig({
      defaultIDType,
      global,
      i18n,
      importMap,
    })
  }

  return clientGlobals
}
