import type {
  Adapter,
  ClientUploadsConfig,
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'
import type { ACLType, Options } from 'ali-oss'
import type { Config, Plugin, UploadCollectionSlug } from 'payload'

import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { initClientUploads } from '@payloadcms/plugin-cloud-storage/utilities'
import OSS from 'ali-oss'

import { getGenerateSignedURLHandler } from './generateSignedURL.js'
import { getGenerateURL } from './generateURL.js'
import { getHandleDelete } from './handleDelete.js'
import { getHandleUpload } from './handleUpload.js'
import { getHandler } from './staticHandler.js'

export type AliyunOssStorageOptions = {
  /**
   * Access control list for uploaded files.
   */
  acl?: ACLType

  /**
   * Do uploads directly on the client to bypass limits on Vercel. You must allow CORS PUT method for the bucket to your website.
   */
  clientUploads?: ClientUploadsConfig

  /**
   * Collection options to apply the Aliyun OSS adapter to.
   */
  collections: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>

  /**
   * Custom domain for endpoint.
   */
  customDomain?: string

  /**
   * Whether or not to disable local storage
   *
   * @default true
   */
  disableLocalStorage?: boolean

  /**
   * Whether or not to enable the plugin
   *
   * Default: true
   */
  enabled?: boolean

  /**
   * Aliyun OSS client configuration. Highly dependent on your AWS setup.
   *
   * [Aliyun OSS Options Docs](https://github.com/ali-sdk/ali-oss?tab=readme-ov-file#ossoptions)
   */
  options: Options
}

type AliyunOssStoragePlugin = (aliyunOssStorageArgs: AliyunOssStorageOptions) => Plugin

export const aliyunOssStorage: AliyunOssStoragePlugin =
  (aliyunOssStorageOptions: AliyunOssStorageOptions) =>
  (incomingConfig: Config): Config => {
    let storageClient: null | OSS = null

    const getStorageClient = (): OSS => {
      if (storageClient) {
        return storageClient
      }
      storageClient = new OSS(aliyunOssStorageOptions.options)

      return storageClient
    }

    const adapter = aliyunOssStorageInternal(getStorageClient, aliyunOssStorageOptions)

    const isPluginDisabled = aliyunOssStorageOptions.enabled === false

    initClientUploads({
      clientHandler: '@payloadcms/storage-aliyun-oss/client#AliyunOssClientUploadHandler',
      collections: aliyunOssStorageOptions.collections,
      config: incomingConfig,
      enabled: !isPluginDisabled && Boolean(aliyunOssStorageOptions.clientUploads),
      serverHandler: getGenerateSignedURLHandler({
        access:
          typeof aliyunOssStorageOptions.clientUploads === 'object'
            ? aliyunOssStorageOptions.clientUploads.access
            : undefined,
        collections: aliyunOssStorageOptions.collections,
        getStorageClient,
      }),
      serverHandlerPath: '/storage-aliyun-oss-generate-signed-url',
    })

    if (isPluginDisabled) {
      return incomingConfig
    }

    // Add adapter to each collection option object
    const collectionsWithAdapter: CloudStoragePluginOptions['collections'] = Object.entries(
      aliyunOssStorageOptions.collections,
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

function aliyunOssStorageInternal(
  getStorageClient: () => OSS,
  { acl, customDomain, options }: AliyunOssStorageOptions,
): Adapter {
  return ({ collection, prefix }): GeneratedAdapter => {
    return {
      name: 'aliyun-oss',
      generateURL: getGenerateURL({ acl, customDomain, options }),
      handleDelete: getHandleDelete({ getStorageClient }),
      handleUpload: getHandleUpload({
        getStorageClient,
        prefix,
      }),
      staticHandler: getHandler({ collection, getStorageClient }),
    }
  }
}
