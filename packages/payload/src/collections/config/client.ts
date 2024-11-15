import type { I18nClient } from '@payloadcms/translations'

import type { StaticDescription } from '../../admin/types.js'
import type {
  LivePreviewConfig,
  ServerOnlyLivePreviewProperties,
  StaticLabel,
} from '../../config/types.js'
import type { ClientField } from '../../fields/config/client.js'
import type { Payload } from '../../types/index.js'
import type { SanitizedCollectionConfig } from './types.js'

import { createClientFields } from '../../fields/config/client.js'
import { deepCopyObjectSimple } from '../../utilities/deepCopyObject.js'

export type ServerOnlyCollectionProperties = keyof Pick<
  SanitizedCollectionConfig,
  'access' | 'custom' | 'endpoints' | 'hooks' | 'joins'
>

export type ServerOnlyCollectionAdminProperties = keyof Pick<
  SanitizedCollectionConfig['admin'],
  'baseListFilter' | 'components' | 'hidden'
>

export type ServerOnlyUploadProperties = keyof Pick<
  SanitizedCollectionConfig['upload'],
  | 'adminThumbnail'
  | 'externalFileHeaderFilter'
  | 'handlers'
  | 'modifyResponseHeaders'
  | 'withMetadata'
>

export type ClientCollectionConfig = {
  admin: {
    description?: StaticDescription
    livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>
    preview?: boolean
  } & Omit<
    SanitizedCollectionConfig['admin'],
    | 'components'
    | 'description'
    | 'joins'
    | 'livePreview'
    | 'preview'
    | ServerOnlyCollectionAdminProperties
  >
  fields: ClientField[]
  labels: {
    plural: StaticLabel
    singular: StaticLabel
  }
} & Omit<SanitizedCollectionConfig, 'admin' | 'fields' | 'labels' | ServerOnlyCollectionProperties>

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
  'baseListFilter',
  'components',
  // 'preview' is handled separately
  // `livePreview` is handled separately
]

export const createClientCollectionConfig = ({
  collection,
  defaultIDType,
  i18n,
}: {
  collection: SanitizedCollectionConfig
  defaultIDType: Payload['config']['db']['defaultIDType']
  i18n: I18nClient
}): ClientCollectionConfig => {
  const clientCollection = deepCopyObjectSimple(
    collection,
    true,
  ) as unknown as ClientCollectionConfig

  clientCollection.fields = createClientFields({
    clientFields: clientCollection?.fields || [],
    defaultIDType,
    fields: collection.fields,
    i18n,
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

  if (!clientCollection.admin) {
    clientCollection.admin = {} as ClientCollectionConfig['admin']
  }

  serverOnlyCollectionAdminProperties.forEach((key) => {
    if (key in clientCollection.admin) {
      delete clientCollection.admin[key]
    }
  })

  if (collection.admin.preview) {
    clientCollection.admin.preview = true
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

  if (description) {
    clientCollection.admin.description = description
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
  collections,
  defaultIDType,
  i18n,
}: {
  collections: SanitizedCollectionConfig[]
  defaultIDType: Payload['config']['db']['defaultIDType']
  i18n: I18nClient
}): ClientCollectionConfig[] => {
  const clientCollections = new Array(collections.length)

  for (let i = 0; i < collections.length; i++) {
    const collection = collections[i]

    clientCollections[i] = createClientCollectionConfig({
      collection,
      defaultIDType,
      i18n,
    })
  }

  return clientCollections
}
