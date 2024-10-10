import type { I18nClient } from '@payloadcms/translations'
import type {
  AdminViewProps,
  ClientCollectionConfig,
  CreateMappedComponent,
  EditViewConfig,
  EditViewProps,
  ImportMap,
  MappedView,
  Payload,
  SanitizedCollectionConfig,
  ServerOnlyCollectionAdminProperties,
  ServerOnlyCollectionProperties,
  ServerOnlyUploadProperties,
} from 'payload'
import type React from 'react'

import { deepCopyObjectSimple } from 'payload'

import { createClientFields } from './fields.js'

const serverOnlyCollectionProperties: Partial<ServerOnlyCollectionProperties>[] = [
  'hooks',
  'access',
  'endpoints',
  'custom',
  'joins',
  // `upload`
  // `admin`
  // are all handled separately
]

const serverOnlyUploadProperties: Partial<ServerOnlyUploadProperties>[] = [
  'adminThumbnail',
  'externalFileHeaderFilter',
  'handlers',
  'modifyResponseHeaders',
  'withMetadata',
]

const serverOnlyCollectionAdminProperties: Partial<ServerOnlyCollectionAdminProperties>[] = [
  'hidden',
  'preview',
  // `livePreview` is handled separately
]

export const createClientCollectionConfig = ({
  clientCollection,
  collection,
  createMappedComponent,
  DefaultEditView,
  DefaultListView,
  i18n,
  importMap,
  payload,
}: {
  clientCollection: ClientCollectionConfig
  collection: SanitizedCollectionConfig
  createMappedComponent: CreateMappedComponent
  DefaultEditView: React.FC<EditViewProps>
  DefaultListView: React.FC<AdminViewProps>
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

  serverOnlyCollectionProperties.forEach((key) => {
    if (key in clientCollection) {
      delete clientCollection[key]
    }
  })

  if ('upload' in clientCollection && typeof clientCollection.upload === 'object') {
    serverOnlyUploadProperties.forEach((key) => {
      if (key in clientCollection.upload) {
        delete clientCollection.upload[key]
      }
    })

    if ('imageSizes' in clientCollection.upload && clientCollection.upload.imageSizes.length) {
      clientCollection.upload.imageSizes = clientCollection.upload.imageSizes.map((size) => {
        const sanitizedSize = { ...size }
        if ('generateImageName' in sanitizedSize) {
          delete sanitizedSize.generateImageName
        }
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

  serverOnlyCollectionAdminProperties.forEach((key) => {
    if (key in clientCollection.admin) {
      delete clientCollection.admin[key]
    }
  })

  if (collection.admin.preview) {
    clientCollection._isPreviewEnabled = true
  }

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

  let description = undefined

  if (collection.admin?.description) {
    if (
      typeof collection.admin?.description === 'string' ||
      typeof collection.admin?.description === 'object'
    ) {
      description = collection.admin.description
    } else if (typeof collection.admin?.description === 'function') {
      description = collection.admin?.description({ t: i18n.t })
    }
  }

  clientCollection.admin.description = description

  if (collection.admin.components?.Description) {
    clientCollection.admin.components.Description = createMappedComponent(
      collection.admin.components.Description,
      {
        clientProps: {
          description,
        },
      },
      undefined,
      'collection.admin.components.Description',
    )
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
    'edit' in collection.admin.components.views &&
    'default' in collection.admin.components.views.edit

  if (!clientCollection.admin.components.views.edit) {
    clientCollection.admin.components.views.edit =
      {} as ClientCollectionConfig['admin']['components']['views']['edit']
  }

  clientCollection.admin.components.views.edit.default = {
    Component: createMappedComponent(
      hasEditView &&
        'Component' in collection.admin.components.views.edit.default &&
        collection.admin.components.views.edit.default.Component
        ? collection.admin.components.views.edit.default.Component
        : null,
      {
        clientProps: {
          collectionSlug: collection.slug,
        },
      },
      DefaultEditView,
      'collection.admin.components.views.edit.default',
    ),
  }

  if (collection?.admin?.components?.views?.edit) {
    for (const key in collection.admin.components.views.edit) {
      const view: EditViewConfig = collection.admin.components.views.edit[key]

      if (!clientCollection.admin.components.views.edit[key]) {
        clientCollection.admin.components.views.edit[key] = {} as MappedView
      }

      if ('Component' in view && key !== 'default') {
        clientCollection.admin.components.views.edit[key].Component = createMappedComponent(
          view.Component,
          {
            clientProps: {
              collectionSlug: collection.slug,
            },
          },
          undefined,
          'collection.admin.components.views.edit.key.Component',
        )
      }

      // Ensure that the label in a tab in an Edit view is a string, translate it if it's a function
      if ('tab' in view && 'label' in view.tab && typeof view.tab.label === 'function') {
        clientCollection.admin.components.views.edit[key].tab.label = view.tab.label({
          t: i18n.t,
        })
      }

      if ('actions' in view && view.actions?.length) {
        clientCollection.admin.components.views.edit[key].actions = view.actions.map((Component) =>
          createMappedComponent(
            Component,
            undefined,
            undefined,
            'collection.admin.components.views.key.admin',
          ),
        )
      }
    }
  }

  const hasListView =
    'admin' in collection &&
    'components' in collection.admin &&
    'views' in collection.admin.components &&
    'list' in collection.admin.components.views

  if (!clientCollection.admin.components.views.list) {
    clientCollection.admin.components.views.list =
      {} as ClientCollectionConfig['admin']['components']['views']['list']
  }

  clientCollection.admin.components.views.list.Component = createMappedComponent(
    hasListView &&
      'Component' in collection.admin.components.views.list &&
      collection.admin.components.views.list.Component
      ? collection.admin.components.views.list.Component
      : null,
    {
      clientProps: {
        collectionSlug: collection.slug,
      },
    },
    DefaultListView,
    'collection.admin.components.views.list',
  )

  if (
    hasListView &&
    'actions' in collection.admin.components.views.list &&
    collection.admin.components.views.list.actions
  ) {
    clientCollection.admin.components.views.list.actions =
      collection.admin.components.views.list.actions.map((Component) =>
        createMappedComponent(
          Component,
          undefined,
          undefined,
          'collection.admin.components.views.list',
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
  clientCollections,
  collections,
  createMappedComponent,
  DefaultEditView,
  DefaultListView,
  i18n,
  importMap,
  payload,
}: {
  clientCollections: ClientCollectionConfig[]
  collections: SanitizedCollectionConfig[]
  createMappedComponent: CreateMappedComponent
  DefaultEditView: React.FC<EditViewProps>
  DefaultListView: React.FC<AdminViewProps>
  i18n: I18nClient
  importMap: ImportMap
  payload: Payload
}): ClientCollectionConfig[] => {
  for (let i = 0; i < collections.length; i++) {
    const collection = collections[i]
    const clientCollection = clientCollections[i]
    clientCollections[i] = createClientCollectionConfig({
      clientCollection,
      collection,
      createMappedComponent,
      DefaultEditView,
      DefaultListView,
      i18n,
      importMap,
      payload,
    })
  }

  return clientCollections
}
