import type { TFunction } from '@payloadcms/translations'
import type {
  ClientGlobalConfig,
  CreateMappedComponent,
  EditViewComponent,
  EditViewProps,
  Field,
  Payload,
  SanitizedConfig,
  ServerOnlyGlobalAdminProperties,
  ServerOnlyGlobalProperties,
} from 'payload'

import { createClientFieldConfigs } from './fields.js'

export const createClientGlobalConfig = ({
  DefaultEditView,
  createMappedComponent,
  global,
  payload,
  t,
}: {
  DefaultEditView: React.FC<EditViewProps>
  createMappedComponent: CreateMappedComponent
  global: SanitizedConfig['globals'][0]
  payload: Payload
  t: TFunction
}): ClientGlobalConfig => {
  const sanitized: ClientGlobalConfig = { ...(global as any as ClientGlobalConfig) } // invert the type

  sanitized.fields = createClientFieldConfigs({
    createMappedComponent,
    fields: sanitized.fields as any as Field[], // invert the type
    payload,
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

    const components = global?.admin?.components

    const editViewFromConfig = components?.views?.Edit

    sanitized.admin.components = {
      ...(components?.elements?.PreviewButton
        ? {
            PreviewButton: createMappedComponent(components?.elements?.PreviewButton),
          }
        : {}),
      ...(components?.elements?.PublishButton
        ? {
            PublishButton: createMappedComponent(components?.elements?.PublishButton),
          }
        : {}),
      ...(components?.elements?.SaveButton
        ? {
            SaveButton: createMappedComponent(components?.elements?.SaveButton),
          }
        : {}),
      ...(components?.elements?.SaveDraftButton
        ? {
            SaveDraftButton: createMappedComponent(components?.elements?.SaveDraftButton),
          }
        : {}),
      views: {
        Edit: {
          Default: {
            Component: createMappedComponent(
              editViewFromConfig?.Default && 'Component' in editViewFromConfig.Default
                ? (editViewFromConfig.Default.Component as EditViewComponent)
                : null,
              {
                collectionSlug: global.slug,
              },
              DefaultEditView,
            ),
            ...(editViewFromConfig?.Default &&
            'actions' in editViewFromConfig.Default &&
            editViewFromConfig.Default.actions.length > 0
              ? {
                  actions: editViewFromConfig?.Default?.actions?.map((Component) =>
                    createMappedComponent(Component),
                  ),
                }
              : {}),
          },
        },
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
  payload,
  t,
}: {
  DefaultEditView: React.FC<EditViewProps>
  createMappedComponent: CreateMappedComponent
  globals: SanitizedConfig['globals']
  payload: Payload
  t: TFunction
}): ClientGlobalConfig[] =>
  globals.map((global) =>
    createClientGlobalConfig({ DefaultEditView, createMappedComponent, global, payload, t }),
  )
