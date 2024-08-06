import type { TFunction } from '@payloadcms/translations'
import type {
  ClientGlobalConfig,
  CreateMappedComponent,
  EditViewComponent,
  EditViewProps,
  Field,
  SanitizedConfig,
  ServerOnlyGlobalAdminProperties,
  ServerOnlyGlobalProperties,
} from 'payload'

import { createClientFieldConfigs } from './fields.js'

export const createClientGlobalConfig = ({
  DefaultEditView,
  createMappedComponent,
  global,
  t,
}: {
  DefaultEditView: React.FC<EditViewProps>
  createMappedComponent: CreateMappedComponent
  global: SanitizedConfig['globals'][0]
  t: TFunction
}): ClientGlobalConfig => {
  const sanitized: ClientGlobalConfig = { ...(global as any as ClientGlobalConfig) } // invert the type

  sanitized.fields = createClientFieldConfigs({
    createMappedComponent,
    fields: sanitized.fields as any as Field[], // invert the type
    t,
  })

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
      'hidden',
      'preview',
    ]

    serverOnlyGlobalAdminProperties.forEach((key) => {
      if (key in sanitized.admin) {
        delete sanitized.admin[key]
      }
    })

    sanitized.admin.components = {} as ClientGlobalConfig['admin']['components']

    if (global?.admin?.components) {
      if (global.admin.components.elements) {
        sanitized.admin.components.elements =
          {} as ClientGlobalConfig['admin']['components']['elements']

        if (global.admin.components.elements?.PreviewButton) {
          sanitized.admin.components.elements.PreviewButton = createMappedComponent(
            global.admin.components.elements.PreviewButton,
          )
        }

        if (global.admin.components.elements?.PublishButton) {
          sanitized.admin.components.elements.PublishButton = createMappedComponent(
            global.admin.components.elements.PublishButton,
          )
        }

        if (global.admin.components.elements?.SaveButton) {
          sanitized.admin.components.elements.SaveButton = createMappedComponent(
            global.admin.components.elements.SaveButton,
          )
        }

        if (global.admin.components.elements?.SaveDraftButton) {
          sanitized.admin.components.elements.SaveDraftButton = createMappedComponent(
            global.admin.components.elements.SaveDraftButton,
          )
        }
      }
    }

    sanitized.admin.components.views = {
      ...((global?.admin?.components?.views ||
        {}) as ClientGlobalConfig['admin']['components']['views']),
    }

    const hasEditView =
      'admin' in global &&
      'components' in global.admin &&
      'views' in global.admin.components &&
      'Edit' in global.admin.components.views &&
      'Default' in global.admin.components.views.Edit

    // @ts-expect-error
    sanitized.admin.components.views.Edit = {
      Default: {
        Component: createMappedComponent(
          hasEditView &&
            'Component' in global.admin.components.views.Edit.Default &&
            global.admin.components.views.Edit.Default.Component,
          {
            globalSlug: global.slug,
          },
          DefaultEditView,
        ),
        ...(hasEditView &&
        'actions' in global.admin.components.views.Edit.Default &&
        global.admin.components.views.Edit.Default.actions
          ? {
              actions: global.admin.components.views.Edit.Default.actions.map((Component) =>
                createMappedComponent(Component),
              ),
            }
          : {}),
      },
    }

    if ('livePreview' in sanitized.admin) {
      sanitized.admin.livePreview = { ...sanitized.admin.livePreview }
      // @ts-expect-error
      delete sanitized.admin.livePreview.url
    }
  }

  return sanitized
}

export const createClientGlobalConfigs = ({
  DefaultEditView,
  createMappedComponent,
  globals,
  t,
}: {
  DefaultEditView: React.FC<EditViewProps>
  createMappedComponent: CreateMappedComponent
  globals: SanitizedConfig['globals']
  t: TFunction
}): ClientGlobalConfig[] =>
  globals.map((global) =>
    createClientGlobalConfig({ DefaultEditView, createMappedComponent, global, t }),
  )
