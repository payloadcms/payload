// @ts-strict-ignore
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

export type ServerOnlyGlobalProperties = keyof Pick<
  SanitizedGlobalConfig,
  'access' | 'admin' | 'custom' | 'endpoints' | 'fields' | 'flattenedFields' | 'hooks'
>

export type ServerOnlyGlobalAdminProperties = keyof Pick<
  SanitizedGlobalConfig['admin'],
  'components' | 'hidden'
>

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
  'flattenedFields',
  // `admin` is handled separately
]

const serverOnlyGlobalAdminProperties: Partial<ServerOnlyGlobalAdminProperties>[] = [
  'hidden',
  'components',
]

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
  const clientGlobal = {} as ClientGlobalConfig

  for (const key in global) {
    if (serverOnlyProperties.includes(key as any)) {
      continue
    }
    switch (key) {
      case 'admin':
        if (!global.admin) {
          break
        }
        clientGlobal.admin = {} as ClientGlobalConfig['admin']
        for (const adminKey in global.admin) {
          if (serverOnlyGlobalAdminProperties.includes(adminKey as any)) {
            continue
          }
          switch (adminKey) {
            case 'livePreview':
              if (!global.admin.livePreview) {
                break
              }
              clientGlobal.admin.livePreview = {}
              if (global.admin.livePreview.breakpoints) {
                clientGlobal.admin.livePreview.breakpoints = global.admin.livePreview.breakpoints
              }
              break
            case 'preview':
              if (global.admin.preview) {
                clientGlobal.admin.preview = true
              }
              break
            default:
              clientGlobal.admin[adminKey] = global.admin[adminKey]
          }
        }
        break
      case 'fields':
        clientGlobal.fields = createClientFields({
          defaultIDType,
          fields: global.fields,
          i18n,
          importMap,
        })
        break
      case 'label':
        clientGlobal.label =
          typeof global.label === 'function' ? global.label({ i18n, t: i18n.t }) : global.label
        break
      default: {
        clientGlobal[key] = global[key]
        break
      }
    }
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
