import type { I18nClient } from '@payloadcms/translations'
import type {
  AdminViewProps,
  ClientCollectionConfig,
  CreateMappedComponent,
  EditViewProps,
  ImportMap,
  Payload,
  SanitizedCollectionConfig,
  ServerOnlyCollectionAdminProperties,
  ServerOnlyCollectionProperties,
} from 'payload'
import type React from 'react'

import { deepCopyObjectSimple } from 'payload'

import { createClientFields } from './fields.js'

export const createClientCollectionConfig = ({
  DefaultEditView,
  DefaultListView,
  clientCollection,
  collection,
  createMappedComponent,
  i18n,
  importMap,
  payload,
}: {
  DefaultEditView: React.FC<EditViewProps>
  DefaultListView: React.FC<AdminViewProps>
  clientCollection: ClientCollectionConfig
  collection: SanitizedCollectionConfig
  createMappedComponent: CreateMappedComponent
  i18n: I18nClient
  importMap: ImportMap
  payload: Payload
}): ClientCollectionConfig => {
  clientCollection.fields = createClientFields({
    clientFields: clientCollection.fields,
    createMappedComponent,
    fields: collection.fields,
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
    if (key in clientCollection) {
      delete clientCollection[key]
    }
  })

  if ('upload' in clientCollection && typeof clientCollection.upload === 'object') {
    delete clientCollection.upload.handlers
    delete clientCollection.upload.adminThumbnail
    delete clientCollection.upload.externalFileHeaderFilter
    delete clientCollection.upload.withMetadata

    if ('imageSizes' in clientCollection.upload && clientCollection.upload.imageSizes.length) {
      clientCollection.upload.imageSizes = clientCollection.upload.imageSizes.map((size) => {
        const sanitizedSize = { ...size }
        if ('generateImageName' in sanitizedSize) delete sanitizedSize.generateImageName
        return sanitizedSize
      })
    }
  }

  if ('auth' in clientCollection && typeof clientCollection.auth === 'object') {
    delete clientCollection.auth.strategies
    delete clientCollection.auth.forgotPassword
    delete clientCollection.auth.verify
  }

  if (collection.labels) {
    Object.entries(collection.labels).forEach(([labelType, collectionLabel]) => {
      if (typeof collectionLabel === 'function') {
        clientCollection.labels[labelType] = collectionLabel({ t: i18n.t })
      }
    })
  }

  const serverOnlyCollectionAdminProperties: Partial<ServerOnlyCollectionAdminProperties>[] = [
    'hidden',
    'preview',
    // `livePreview` is handled separately
  ]

  serverOnlyCollectionAdminProperties.forEach((key) => {
    if (key in clientCollection.admin) {
      delete clientCollection.admin[key]
    }
  })

  clientCollection.admin.components = {} as ClientCollectionConfig['admin']['components']

  if (collection?.admin?.components) {
    if (collection.admin.components?.edit) {
      clientCollection.admin.components.edit =
        {} as ClientCollectionConfig['admin']['components']['edit']

      if (collection.admin.components.edit?.PreviewButton) {
        clientCollection.admin.components.edit.PreviewButton = createMappedComponent(
          collection.admin.components.edit.PreviewButton,
          undefined,
          undefined,
          'collection.admin.components.edit.PreviewButton',
        )
      }

      if (collection.admin.components.edit?.PublishButton) {
        clientCollection.admin.components.edit.PublishButton = createMappedComponent(
          collection.admin.components.edit.PublishButton,
          undefined,
          undefined,
          'collection.admin.components.edit.PublishButton',
        )
      }

      if (collection.admin.components.edit?.SaveButton) {
        clientCollection.admin.components.edit.SaveButton = createMappedComponent(
          collection.admin.components.edit.SaveButton,
          undefined,
          undefined,
          'collection.admin.components.edit.SaveButton',
        )
      }

      if (collection.admin.components.edit?.SaveDraftButton) {
        clientCollection.admin.components.edit.SaveDraftButton = createMappedComponent(
          collection.admin.components.edit.SaveDraftButton,
          undefined,
          undefined,
          'collection.admin.components.edit.SaveDraftButton',
        )
      }

      if (collection.admin.components.edit?.Upload) {
        clientCollection.admin.components.edit.Upload = createMappedComponent(
          collection.admin.components.edit.Upload,
          undefined,
          undefined,
          'collection.admin.components.edit.Upload',
        )
      }
    }

    if (collection.admin.components?.beforeList) {
      clientCollection.admin.components.beforeList = collection.admin.components.beforeList.map(
        (Component) =>
          createMappedComponent(
            Component,
            undefined,
            undefined,
            'collection.admin.components.beforeList',
          ),
      )
    }

    if (collection.admin.components?.beforeListTable) {
      clientCollection.admin.components.beforeListTable =
        collection.admin.components.beforeListTable.map((Component) =>
          createMappedComponent(
            Component,
            undefined,
            undefined,
            'collection.admin.components.beforeListTable',
          ),
        )
    }

    if (collection.admin.components?.afterList) {
      clientCollection.admin.components.afterList = collection.admin.components.afterList.map(
        (Component) =>
          createMappedComponent(
            Component,
            undefined,
            undefined,
            'collection.admin.components.afterList',
          ),
      )
    }

    if (collection.admin.components?.afterListTable) {
      clientCollection.admin.components.afterListTable =
        collection.admin.components.afterListTable.map((Component) =>
          createMappedComponent(
            Component,
            undefined,
            undefined,
            'collection.admin.components.afterListTable',
          ),
        )
    }
  }

  clientCollection.admin.components.views = (
    collection?.admin?.components?.views
      ? deepCopyObjectSimple(collection?.admin?.components?.views)
      : {}
  ) as ClientCollectionConfig['admin']['components']['views']

  const hasEditView =
    'admin' in collection &&
    'components' in collection.admin &&
    'views' in collection.admin.components &&
    'Edit' in collection.admin.components.views &&
    'Default' in collection.admin.components.views.Edit

  if (!clientCollection.admin.components.views.Edit) {
    clientCollection.admin.components.views.Edit =
      {} as ClientCollectionConfig['admin']['components']['views']['Edit']
  }

  clientCollection.admin.components.views.Edit.Default = {
    Component: createMappedComponent(
      hasEditView &&
        'Component' in collection.admin.components.views.Edit.Default &&
        collection.admin.components.views.Edit.Default.Component,
      {
        collectionSlug: collection.slug,
      },
      DefaultEditView,
      'collection.admin.components.views.Edit.Default',
    ),
  }

  if (
    hasEditView &&
    'actions' in collection.admin.components.views.Edit.Default &&
    collection.admin.components.views.Edit.Default.actions
  ) {
    clientCollection.admin.components.views.Edit.Default.actions =
      collection.admin.components.views.Edit.Default.actions.map((Component) =>
        createMappedComponent(
          Component,
          undefined,
          undefined,
          'collection.admin.components.views.Edit.Default',
        ),
      )
  }

  const hasListView =
    'admin' in collection &&
    'components' in collection.admin &&
    'views' in collection.admin.components &&
    'List' in collection.admin.components.views

  if (!clientCollection.admin.components.views.List) {
    clientCollection.admin.components.views.List =
      {} as ClientCollectionConfig['admin']['components']['views']['List']
  }

  clientCollection.admin.components.views.List.Component = createMappedComponent(
    hasListView &&
      'Component' in collection.admin.components.views.List &&
      collection.admin.components.views.List.Component,
    {
      collectionSlug: collection.slug,
    },
    DefaultListView,
    'collection.admin.components.views.List ',
  )

  if (
    hasListView &&
    'actions' in collection.admin.components.views.List &&
    collection.admin.components.views.List.actions
  ) {
    clientCollection.admin.components.views.List.actions =
      collection.admin.components.views.List.actions.map((Component) =>
        createMappedComponent(
          Component,
          undefined,
          undefined,
          'collection.admin.components.views.List',
        ),
      )
  }

  if (
    'livePreview' in clientCollection.admin &&
    clientCollection.admin.livePreview &&
    'url' in clientCollection.admin.livePreview
  ) {
    delete clientCollection.admin.livePreview.url
  }

  return clientCollection
}

export const createClientCollectionConfigs = ({
  DefaultEditView,
  DefaultListView,
  clientCollections,
  collections,
  createMappedComponent,
  i18n,
  importMap,
  payload,
}: {
  DefaultEditView: React.FC<EditViewProps>
  DefaultListView: React.FC<AdminViewProps>
  clientCollections: ClientCollectionConfig[]
  collections: SanitizedCollectionConfig[]
  createMappedComponent: CreateMappedComponent
  i18n: I18nClient
  importMap: ImportMap
  payload: Payload
}): ClientCollectionConfig[] => {
  for (let i = 0; i < collections.length; i++) {
    const collection = collections[i]
    const clientCollection = clientCollections[i]
    clientCollections[i] = createClientCollectionConfig({
      DefaultEditView,
      DefaultListView,
      clientCollection,
      collection,
      createMappedComponent,
      i18n,
      importMap,
      payload,
    })
  }

  return clientCollections
}
