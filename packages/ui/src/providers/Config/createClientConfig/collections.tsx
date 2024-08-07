import type { I18nClient } from '@payloadcms/translations'
import type {
  AdminViewProps,
  ClientCollectionConfig,
  CreateMappedComponent,
  EditViewProps,
  Field,
  ImportMap,
  Payload,
  SanitizedCollectionConfig,
  ServerOnlyCollectionAdminProperties,
  ServerOnlyCollectionProperties,
} from 'payload'
import type React from 'react'

import { createClientFieldConfigs } from './fields.js'

export const createClientCollectionConfig = ({
  DefaultEditView,
  DefaultListView,
  collection,
  createMappedComponent,
  i18n,
  importMap,
  payload,
}: {
  DefaultEditView: React.FC<EditViewProps>
  DefaultListView: React.FC<AdminViewProps>
  collection: SanitizedCollectionConfig
  createMappedComponent: CreateMappedComponent
  i18n: I18nClient
  importMap: ImportMap
  payload: Payload
}): ClientCollectionConfig => {
  const sanitized: ClientCollectionConfig = { ...(collection as any as ClientCollectionConfig) } // invert the type

  sanitized.fields = createClientFieldConfigs({
    createMappedComponent,
    fields: sanitized.fields as any as Field[], // invert the type
    i18n,
    importMap,
    payload,
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
        sanitized.labels[labelType] = collectionLabel({ t: i18n.t })
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

  sanitized.admin.components = {} as ClientCollectionConfig['admin']['components']

  if (collection?.admin?.components) {
    if (collection.admin.components?.edit) {
      sanitized.admin.components.edit = {} as ClientCollectionConfig['admin']['components']['edit']

      if (collection.admin.components.edit?.PreviewButton) {
        sanitized.admin.components.edit.PreviewButton = createMappedComponent(
          collection.admin.components.edit.PreviewButton,
        )
      }

      if (collection.admin.components.edit?.PublishButton) {
        sanitized.admin.components.edit.PublishButton = createMappedComponent(
          collection.admin.components.edit.PublishButton,
        )
      }

      if (collection.admin.components.edit?.SaveButton) {
        sanitized.admin.components.edit.SaveButton = createMappedComponent(
          collection.admin.components.edit.SaveButton,
        )
      }

      if (collection.admin.components.edit?.SaveDraftButton) {
        sanitized.admin.components.edit.SaveDraftButton = createMappedComponent(
          collection.admin.components.edit.SaveDraftButton,
        )
      }

      if (collection.admin.components.edit?.Upload) {
        sanitized.admin.components.edit.Upload = createMappedComponent(
          collection.admin.components.edit.Upload,
        )
      }
    }

    if (collection.admin.components?.beforeList) {
      sanitized.admin.components.beforeList = collection.admin.components.beforeList.map(
        (Component) => createMappedComponent(Component),
      )
    }

    if (collection.admin.components?.beforeListTable) {
      sanitized.admin.components.beforeListTable = collection.admin.components.beforeListTable.map(
        (Component) => createMappedComponent(Component),
      )
    }

    if (collection.admin.components?.afterList) {
      sanitized.admin.components.afterList = collection.admin.components.afterList.map(
        (Component) => createMappedComponent(Component),
      )
    }

    if (collection.admin.components?.afterListTable) {
      sanitized.admin.components.afterListTable = collection.admin.components.afterListTable.map(
        (Component) => createMappedComponent(Component),
      )
    }
  }

  sanitized.admin.components.views = {
    ...((collection?.admin?.components?.views ||
      {}) as ClientCollectionConfig['admin']['components']['views']),
  }

  const hasEditView =
    'admin' in collection &&
    'components' in collection.admin &&
    'views' in collection.admin.components &&
    'Edit' in collection.admin.components.views &&
    'Default' in collection.admin.components.views.Edit

  // @ts-expect-error
  sanitized.admin.components.views.Edit = {
    Default: {
      Component: createMappedComponent(
        hasEditView &&
          'Component' in collection.admin.components.views.Edit.Default &&
          collection.admin.components.views.Edit.Default.Component,
        {
          collectionSlug: collection.slug,
        },
        DefaultEditView,
      ),
      ...(hasEditView &&
      'actions' in collection.admin.components.views.Edit.Default &&
      collection.admin.components.views.Edit.Default.actions
        ? {
            actions: collection.admin.components.views.Edit.Default.actions.map((Component) =>
              createMappedComponent(Component),
            ),
          }
        : {}),
    },
  }

  const hasListView =
    'admin' in collection &&
    'components' in collection.admin &&
    'views' in collection.admin.components &&
    'List' in collection.admin.components.views

  // @ts-expect-error
  sanitized.admin.components.views.List = {
    Component: createMappedComponent(
      hasListView &&
        'Component' in collection.admin.components.views.List &&
        collection.admin.components.views.List.Component,
      {
        collectionSlug: collection.slug,
      },
      DefaultListView,
    ),
    ...(hasListView &&
    'actions' in collection.admin.components.views.List &&
    collection.admin.components.views.List.actions
      ? {
          actions: collection.admin.components.views.List.actions.map((Component) =>
            createMappedComponent(Component),
          ),
        }
      : {}),
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
  i18n,
  importMap,
  payload,
}: {
  DefaultEditView: React.FC<EditViewProps>
  DefaultListView: React.FC<AdminViewProps>
  collections: SanitizedCollectionConfig[]
  createMappedComponent: CreateMappedComponent
  i18n: I18nClient
  importMap: ImportMap
  payload: Payload
}): ClientCollectionConfig[] =>
  collections.map((collection) =>
    createClientCollectionConfig({
      DefaultEditView,
      DefaultListView,
      collection,
      createMappedComponent,
      i18n,
      importMap,
      payload,
    }),
  )
