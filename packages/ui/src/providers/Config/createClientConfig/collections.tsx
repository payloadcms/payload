import type { TFunction } from '@payloadcms/translations'
import type {
  AdminViewProps,
  ClientCollectionConfig,
  CreateMappedComponent,
  EditViewComponent,
  EditViewProps,
  Field,
  SanitizedCollectionConfig,
  ServerOnlyCollectionAdminProperties,
  ServerOnlyCollectionProperties,
} from 'payload'

import { createClientFieldConfigs } from './fields.js'

export const createClientCollectionConfig = ({
  DefaultEditView,
  DefaultListView,
  collection,
  createMappedComponent,
  t,
}: {
  DefaultEditView: React.FC<EditViewProps>
  DefaultListView: React.FC<AdminViewProps>
  collection: SanitizedCollectionConfig
  createMappedComponent: CreateMappedComponent
  t: TFunction
}): ClientCollectionConfig => {
  const sanitized: ClientCollectionConfig = { ...(collection as any as ClientCollectionConfig) } // invert the type

  sanitized.fields = createClientFieldConfigs({
    createMappedComponent,
    fields: sanitized.fields as any as Field[], // invert the type
    t,
  })

  const serverOnlyCollectionProperties: Partial<ServerOnlyCollectionProperties>[] = [
    'hooks',
    'access',
    'endpoints',
    'custom',
    // `upload`
    // `admin`
    // are all handled separately
  ]

  serverOnlyCollectionProperties.forEach((key) => {
    if (key in sanitized) {
      delete sanitized[key]
    }
  })

  if ('upload' in sanitized && typeof sanitized.upload === 'object') {
    sanitized.upload = { ...sanitized.upload }
    delete sanitized.upload.handlers
    delete sanitized.upload.adminThumbnail
    delete sanitized.upload.externalFileHeaderFilter
    delete sanitized.upload.withMetadata
  }

  if ('auth' in sanitized && typeof sanitized.auth === 'object') {
    sanitized.auth = { ...sanitized.auth }
    delete sanitized.auth.strategies
    delete sanitized.auth.forgotPassword
    delete sanitized.auth.verify
  }

  if (sanitized.labels) {
    Object.entries(sanitized.labels).forEach(([labelType, collectionLabel]) => {
      if (typeof collectionLabel === 'function') {
        sanitized.labels[labelType] = collectionLabel({ t })
      }
    })
  }

  sanitized.admin = { ...(sanitized.admin || ({} as any)) }

  const serverOnlyCollectionAdminProperties: Partial<ServerOnlyCollectionAdminProperties>[] = [
    'hidden',
    'preview',
    // `livePreview` is handled separately
  ]

  serverOnlyCollectionAdminProperties.forEach((key) => {
    if (key in sanitized.admin) {
      delete sanitized.admin[key]
    }
  })

  const components = collection?.admin?.components

  const editViewFromConfig = components?.views?.Edit

  const listViewFromConfig = components?.views?.List

  sanitized.admin.components = {
    ...(components?.edit?.PreviewButton
      ? {
          PreviewButton: createMappedComponent(components?.edit?.PreviewButton),
        }
      : {}),
    ...(components?.edit?.PublishButton
      ? {
          PublishButton: createMappedComponent(components?.edit?.PublishButton),
        }
      : {}),
    ...(components?.edit?.SaveButton
      ? {
          SaveButton: createMappedComponent(components?.edit?.SaveButton),
        }
      : {}),
    ...(components?.edit?.SaveDraftButton
      ? {
          SaveDraftButton: createMappedComponent(components?.edit?.SaveDraftButton),
        }
      : {}),
    ...(components?.edit?.Upload
      ? {
          Upload: createMappedComponent(components?.edit?.Upload),
        }
      : {}),
    ...(components?.afterList
      ? {
          afterList: components?.afterList?.map((Component) => createMappedComponent(Component)),
        }
      : {}),
    ...(components?.afterListTable
      ? {
          afterListTable: components?.afterListTable?.map((Component) =>
            createMappedComponent(Component),
          ),
        }
      : {}),
    ...(components?.beforeList
      ? {
          beforeList: components?.beforeList?.map((Component) => createMappedComponent(Component)),
        }
      : {}),
    ...(components?.beforeListTable
      ? {
          beforeListTable: components?.beforeListTable?.map((Component) =>
            createMappedComponent(Component),
          ),
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
              collectionSlug: collection.slug,
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
      List: {
        Component: createMappedComponent(
          listViewFromConfig?.Component,
          {
            collectionSlug: collection.slug,
          },
          DefaultListView,
        ),
        ...(listViewFromConfig?.actions && listViewFromConfig?.actions.length > 0
          ? {
              actions: createMappedComponent(components?.views?.List?.actions),
            }
          : {}),
      },
    },
  }

  if ('livePreview' in sanitized.admin) {
    sanitized.admin.livePreview = { ...sanitized.admin.livePreview }
    // @ts-expect-error
    delete sanitized.admin.livePreview.url
  }

  return sanitized
}

export const createClientCollectionConfigs = ({
  DefaultEditView,
  DefaultListView,
  collections,
  createMappedComponent,
  t,
}: {
  DefaultEditView: React.FC<EditViewProps>
  DefaultListView: React.FC<AdminViewProps>
  collections: SanitizedCollectionConfig[]
  createMappedComponent: CreateMappedComponent
  t: TFunction
}): ClientCollectionConfig[] =>
  collections.map((collection) =>
    createClientCollectionConfig({
      DefaultEditView,
      DefaultListView,
      collection,
      createMappedComponent,
      t,
    }),
  )
