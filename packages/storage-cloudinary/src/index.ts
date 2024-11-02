import type {
  Adapter,
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'
import type { Config, Plugin } from 'payload'

import { ConfigOptions, v2 as cloudinary } from "cloudinary";
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'

import { getGenerateUrl } from './generateURL.js'
import { getHandleDelete } from './handleDelete.js'
import { getHandleUpload } from './handleUpload.js'
import { getStaticHandler } from './staticHandler.js'

// Video extensions
export const videoExtensions = ["mp2", "mp3", "mp4", "mov", "avi", "mkv", "flv", "wmv", "webm", "mpg", "mpe", "mpeg"]


export type CloudinaryStorageOptions = {
  /**
   * Folder name to upload files.
   */
  folder: string
  /**
   * Collection options to apply the Cloudinary adapter to.
   */
  collections: Record<string, Omit<CollectionOptions, 'adapter'> | true>
  /**
   * Whether or not to enable the plugin.
   *
   * Default: true
   */
  enabled?: boolean

  /**
   * Cloudinary client configuration.
   *
   * @see https://github.com/cloudinary/cloudinary_npm
   */
  config: ConfigOptions
}

type CloudinaryStoragePlugin = (storageCloudinaryArgs: CloudinaryStorageOptions) => Plugin

export const cloudinaryStorage: CloudinaryStoragePlugin =
  (cloudinaryStorageOptions: CloudinaryStorageOptions) =>
  (incomingConfig: Config): Config => {
    if (cloudinaryStorageOptions.enabled === false) {
      return incomingConfig
    }

    const adapter = cloudinaryStorageInternal(cloudinaryStorageOptions)

    // Add adapter to each collection option object
    const collectionsWithAdapter: CloudStoragePluginOptions['collections'] = Object.entries(
      cloudinaryStorageOptions.collections,
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


function cloudinaryStorageInternal({ folder, config = {} }: CloudinaryStorageOptions): Adapter {
  return ({ collection, prefix }): GeneratedAdapter => {
    if (!cloudinary) {
      throw new Error(
        'The package cloudinary is not installed, but is required for the plugin-cloud-storage Cloudinary adapter. Please install it.'
      )
    }

    let storageClient: null | typeof cloudinary = null

    const getStorageClient = (): typeof cloudinary => {
      if (storageClient) return storageClient

      cloudinary.config(config)
      storageClient = cloudinary
      return storageClient
    }

    return {
      name: 'cloudinary',
      generateURL: getGenerateUrl({ folder, getStorageClient }),
      handleDelete: getHandleDelete({ folder, getStorageClient }),
      handleUpload: getHandleUpload({
        folder,
        collection,
        getStorageClient,
        prefix
      }),
      staticHandler: getStaticHandler({ folder, collection, getStorageClient }),
    }
  }
}
