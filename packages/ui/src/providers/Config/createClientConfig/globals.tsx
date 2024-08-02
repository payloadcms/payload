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
  global,
  t,
  createMappedComponent,
  DefaultEditView,
}: {
  global: SanitizedConfig['globals'][0]
  t: TFunction
  createMappedComponent: CreateMappedComponent
  DefaultEditView: React.FC<EditViewProps>
}): ClientGlobalConfig => {
  const sanitized: ClientGlobalConfig = { ...(global as any as ClientGlobalConfig) } // invert the type

  sanitized.fields = createClientFieldConfigs({
    fields: sanitized.fields as any as Field[], // invert the type
    t,
    createMappedComponent,
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

    const editViewFromConfig = global?.admin?.components?.views?.Edit

    sanitized.admin.components = {
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
            ...(editViewFromConfig?.Default && 'actions' in editViewFromConfig.Default
              ? {
                  actions: editViewFromConfig?.Default?.actions?.map((Component) =>
                    createMappedComponent(Component),
                  ),
                }
              : {}),
          },
        },
      },
      SaveButton: createMappedComponent(global?.admin?.components?.elements?.SaveButton),
      SaveDraftButton: createMappedComponent(global?.admin?.components?.elements?.SaveDraftButton),
      PreviewButton: createMappedComponent(global?.admin?.components?.elements?.PreviewButton),
      PublishButton: createMappedComponent(global?.admin?.components?.elements?.PublishButton),
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
  globals,
  t,
  createMappedComponent,
  DefaultEditView,
}: {
  globals: SanitizedConfig['globals']
  t: TFunction
  createMappedComponent: CreateMappedComponent
  DefaultEditView: React.FC<EditViewProps>
}): ClientGlobalConfig[] =>
  globals.map((global) =>
    createClientGlobalConfig({ global, t, createMappedComponent, DefaultEditView }),
  )
