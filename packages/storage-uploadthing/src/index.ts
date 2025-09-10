import type {
  Adapter,
  ClientUploadsAccess,
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'
import type { Config, Field, Plugin, UploadCollectionSlug } from 'payload'
import type { createUploadthing } from 'uploadthing/server'
import type { UTApiOptions } from 'uploadthing/types'

import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { initClientUploads } from '@payloadcms/plugin-cloud-storage/utilities'
import { UTApi } from 'uploadthing/server'

import { generateURL } from './generateURL.js'
import { getClientUploadRoute } from './getClientUploadRoute.js'
import { getHandleDelete } from './handleDelete.js'
import { getHandleUpload } from './handleUpload.js'
import { getHandler } from './staticHandler.js'

export type FileRouterInputConfig = Parameters<ReturnType<typeof createUploadthing>>[0]

export type UploadthingStorageOptions = {
  /**
   * Do uploads directly on the client, to bypass limits on Vercel.
   */
  clientUploads?:
    | {
        access?: ClientUploadsAccess
        routerInputConfig?: FileRouterInputConfig
      }
    | boolean

  /**
   * Collection options to apply the adapter to.
   */
  collections: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>

  /**
   * Whether or not to enable the plugin
   *
   * Default: true
   */
  enabled?: boolean

  /**
   * Uploadthing Options
   */
  options: {
    /**
     * @default 'public-read'
     */
    acl?: ACL
  } & UTApiOptions
}

type UploadthingPlugin = (uploadthingStorageOptions: UploadthingStorageOptions) => Plugin

/** NOTE: not synced with uploadthing's internal types. Need to modify if more options added */
export type ACL = 'private' | 'public-read'

export const uploadthingStorage: UploadthingPlugin =
  (uploadthingStorageOptions: UploadthingStorageOptions) =>
  (incomingConfig: Config): Config => {
    const isPluginDisabled = uploadthingStorageOptions.enabled === false

    initClientUploads({
      clientHandler: '@payloadcms/storage-uploadthing/client#UploadthingClientUploadHandler',
      collections: uploadthingStorageOptions.collections,
      config: incomingConfig,
      enabled: !isPluginDisabled && Boolean(uploadthingStorageOptions.clientUploads),
      serverHandler: getClientUploadRoute({
        access:
          typeof uploadthingStorageOptions.clientUploads === 'object'
            ? uploadthingStorageOptions.clientUploads.access
            : undefined,
        acl: uploadthingStorageOptions.options.acl || 'public-read',
        routerInputConfig:
          typeof uploadthingStorageOptions.clientUploads === 'object'
            ? uploadthingStorageOptions.clientUploads.routerInputConfig
            : undefined,
        token: uploadthingStorageOptions.options.token,
      }),
      serverHandlerPath: '/storage-uploadthing-client-upload-route',
    })

    if (isPluginDisabled) {
      return incomingConfig
    }

    // Default ACL to public-read
    if (!uploadthingStorageOptions.options.acl) {
      uploadthingStorageOptions.options.acl = 'public-read'
    }

    const adapter = uploadthingInternal(uploadthingStorageOptions)

    // Add adapter to each collection option object
    const collectionsWithAdapter: CloudStoragePluginOptions['collections'] = Object.entries(
      uploadthingStorageOptions.collections,
    ).reduce(
      (acc, [slug, collOptions]) => ({
        ...acc,
        [slug]: {
          ...(collOptions === true ? {} : collOptions),

          // Disable payload access control if the ACL is public-read or not set
          // ...(uploadthingStorageOptions.options.acl === 'public-read'
          //   ? { disablePayloadAccessControl: true }
          //   : {}),

          adapter,
        },
      }),
      {} as Record<string, CollectionOptions>,
    )

    // Set disableLocalStorage: true for collections specified in the plugin options
    const config = {
      ...incomingConfig,
      collections: (incomingConfig.collections || []).map((collection) => {
        if (!collectionsWithAdapter[collection.slug]) {
          return collection
        }

        return {
          ...collection,
          upload: {
            ...(typeof collection.upload === 'object' ? collection.upload : {}),
            disableLocalStorage: true,
          },
        }
      }),
    }

    return cloudStoragePlugin({
      collections: collectionsWithAdapter,
    })(config)
  }

function uploadthingInternal(options: UploadthingStorageOptions): Adapter {
  const fields: Field[] = [
    {
      name: '_key',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
  ]

  return (): GeneratedAdapter => {
    const {
      clientUploads,
      options: { acl = 'public-read', ...utOptions },
    } = options

    const utApi = new UTApi(utOptions)

    return {
      name: 'uploadthing',
      clientUploads,
      fields,
      generateURL,
      handleDelete: getHandleDelete({ utApi }),
      handleUpload: getHandleUpload({ acl, utApi }),
      staticHandler: getHandler({ utApi }),
    }
  }
}
