import type {
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
} from '@payloadcms/plugin-cloud-storage/types'
import type { Adapter, GeneratedAdapter } from '@payloadcms/plugin-cloud-storage/types'
import type { Config, Plugin } from 'payload/config'

import { getStore } from '@netlify/blobs'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'

import { getHandleDelete } from './handleDelete.js'
import { getHandleUpload } from './handleUpload.js'
import { getStaticHandler } from './staticHandler.js'

export type NetlifyBlobsOptions = {
  /**
   * Collections to apply the Netlify Blobs adapter to
   */
  collections: Record<string, Omit<CollectionOptions, 'adapter'> | true>

  /**
   * Whether or not to enable the plugin
   *
   * @default true
   */
  enabled?: boolean

  /**
   * Name of the store to use
   * @default 'payload'
   */

  storeName?: string
}

const defaultUploadOptions = {
  enabled: true,
  storeName: 'payload',
}

type NetlifyBlobsStoragePlugin = (netlifyBlobsStorageOpts: NetlifyBlobsOptions) => Plugin

export const netlifyBlobsStorage: NetlifyBlobsStoragePlugin =
  (options: NetlifyBlobsOptions) =>
  (incomingConfig: Config): Config => {
    if (options.enabled === false) {
      return incomingConfig
    }

    const optionsWithDefaults = {
      ...defaultUploadOptions,
      ...options,
    }

    const adapter = netlifyBlobsInternal(optionsWithDefaults)

    // Add adapter to each collection option object
    const collectionsWithAdapter: CloudStoragePluginOptions['collections'] = Object.entries(
      options.collections,
    ).reduce(
      (acc, [slug, collOptions]) => ({
        ...acc,
        [slug]: {
          ...(collOptions === true ? {} : collOptions),
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

function netlifyBlobsInternal(options: Required<NetlifyBlobsOptions>): Adapter {
  return ({ collection }): GeneratedAdapter => {
    const store = getStore(options.storeName)
    return {
      name: 'netlify-blobs',
      generateURL: () => '',
      handleDelete: getHandleDelete({ store }),
      handleUpload: getHandleUpload({ store }),
      staticHandler: getStaticHandler({ store }, collection),
    }
  }
}
