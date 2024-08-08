import type { I18nClient } from '@payloadcms/translations'
import type {
  ClientGlobalConfig,
  CreateMappedComponent,
  EditViewProps,
  ImportMap,
  Payload,
  SanitizedConfig,
  ServerOnlyGlobalAdminProperties,
  ServerOnlyGlobalProperties,
} from 'payload'
import type React from 'react'

import { deepCopyObjectSimple } from 'payload'

import { createClientFields } from './fields.js'

export const createClientGlobalConfig = ({
  DefaultEditView,
  clientGlobal,
  createMappedComponent,
  global,
  i18n,
  importMap,
  payload,
}: {
  DefaultEditView: React.FC<EditViewProps>
  clientGlobal: ClientGlobalConfig
  createMappedComponent: CreateMappedComponent
  global: SanitizedConfig['globals'][0]
  i18n: I18nClient
  importMap: ImportMap
  payload: Payload
}): ClientGlobalConfig => {
  clientGlobal.fields = createClientFields({
    clientFields: clientGlobal.fields,
    createMappedComponent,
    fields: global.fields,
    i18n,
    importMap,
    payload,
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

  if ('admin' in clientGlobal) {
    const serverOnlyGlobalAdminProperties: Partial<ServerOnlyGlobalAdminProperties>[] = [
      'hidden',
      'preview',
    ]

    serverOnlyGlobalAdminProperties.forEach((key) => {
      if (key in clientGlobal.admin) {
        delete clientGlobal.admin[key]
      }
    })

    clientGlobal.admin.components = {} as ClientGlobalConfig['admin']['components']

    if (global?.admin?.components) {
      if (global.admin.components.elements) {
        clientGlobal.admin.components.elements =
          {} as ClientGlobalConfig['admin']['components']['elements']

        if (global.admin.components.elements?.PreviewButton) {
          clientGlobal.admin.components.elements.PreviewButton = createMappedComponent(
            global.admin.components.elements.PreviewButton,
            undefined,
            undefined,
            'global.admin.components.elements.PreviewButton',
          )
        }

        if (global.admin.components.elements?.PublishButton) {
          clientGlobal.admin.components.elements.PublishButton = createMappedComponent(
            global.admin.components.elements.PublishButton,
            undefined,
            undefined,
            'global.admin.components.elements.PublishButton',
          )
        }

        if (global.admin.components.elements?.SaveButton) {
          clientGlobal.admin.components.elements.SaveButton = createMappedComponent(
            global.admin.components.elements.SaveButton,
            undefined,
            undefined,
            'global.admin.components.elements.SaveButton',
          )
        }

        if (global.admin.components.elements?.SaveDraftButton) {
          clientGlobal.admin.components.elements.SaveDraftButton = createMappedComponent(
            global.admin.components.elements.SaveDraftButton,
            undefined,
            undefined,
            'global.admin.components.elements.SaveDraftButton',
          )
        }
      }
    }

    clientGlobal.admin.components.views = (
      global?.admin?.components?.views ? deepCopyObjectSimple(global?.admin?.components?.views) : {}
    ) as ClientGlobalConfig['admin']['components']['views']

    const hasEditView =
      'admin' in global &&
      'components' in global.admin &&
      'views' in global.admin.components &&
      'Edit' in global.admin.components.views &&
      'Default' in global.admin.components.views.Edit

    if (!clientGlobal.admin.components.views.Edit) {
      clientGlobal.admin.components.views.Edit =
        {} as ClientGlobalConfig['admin']['components']['views']['Edit']
    }

    clientGlobal.admin.components.views.Edit.Default = {
      Component: createMappedComponent(
        hasEditView &&
          'Component' in global.admin.components.views.Edit.Default &&
          global.admin.components.views.Edit.Default.Component,
        {
          globalSlug: global.slug,
        },
        DefaultEditView,
        'global.admin.components.views.Edit.Default',
      ),
    }
    if (
      hasEditView &&
      'actions' in global.admin.components.views.Edit.Default &&
      global.admin.components.views.Edit.Default.actions
    ) {
      clientGlobal.admin.components.views.Edit.Default.actions =
        global.admin.components.views.Edit.Default.actions.map((Component) =>
          createMappedComponent(
            Component,
            undefined,
            undefined,
            'global.admin.components.views.Edit.Default.actions',
          ),
        )
    }

    if (
      'livePreview' in clientGlobal.admin &&
      clientGlobal.admin.livePreview &&
      'url' in clientGlobal.admin.livePreview
    ) {
      delete clientGlobal.admin.livePreview.url
    }
  }

  return clientGlobal
}

export const createClientGlobalConfigs = ({
  DefaultEditView,
  clientGlobals,
  createMappedComponent,
  globals,
  i18n,
  importMap,
  payload,
}: {
  DefaultEditView: React.FC<EditViewProps>
  clientGlobals: ClientGlobalConfig[]
  createMappedComponent: CreateMappedComponent
  globals: SanitizedConfig['globals']
  i18n: I18nClient
  importMap: ImportMap
  payload: Payload
}): ClientGlobalConfig[] => {
  for (let i = 0; i < globals.length; i++) {
    const global = globals[i]
    const clientGlobal = clientGlobals[i]
    clientGlobals[i] = createClientGlobalConfig({
      DefaultEditView,
      clientGlobal,
      createMappedComponent,
      global,
      i18n,
      importMap,
      payload,
    })
  }
  return clientGlobals
}
