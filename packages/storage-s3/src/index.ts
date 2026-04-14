import type {
  ClientUploadsConfig,
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
} from '@payloadcms/plugin-cloud-storage/types'
import type { NodeHttpHandlerOptions } from '@smithy/node-http-handler'
import type { Config, Plugin, UploadCollectionSlug } from 'payload'

import * as AWS from '@aws-sdk/client-s3'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { initClientUploads } from '@payloadcms/plugin-cloud-storage/utilities'

import type { SignedDownloadsConfig } from './getFile.js'

import { createS3Adapter } from './adapter.js'
import { getGenerateSignedURLHandler } from './generateSignedURL.js'

export type S3StorageOptions = {
  /**
   * Access control list for uploaded files.
   */
  acl?: 'private' | 'public-read'

  /**
   * When enabled, fields (like the prefix field) will always be inserted into
   * the collection schema regardless of whether the plugin is enabled. This
   * ensures a consistent schema across all environments.
   *
   * This will be enabled by default in Payload v4.
   *
   * @default false
   */
  alwaysInsertFields?: boolean

  /**
   * Bucket name to upload files to.
   *
   * Must follow [AWS S3 bucket naming conventions](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html).
   */

  bucket: string

  /**
   * Optional cache key to identify the S3 storage client instance.
   * If not provided, a default key will be used.
   *
   * @default `s3:containerName`
   */
  clientCacheKey?: string

  /**
   * Do uploads directly on the client to bypass limits on Vercel. You must allow CORS PUT method for the bucket to your website.
   */
  clientUploads?: ClientUploadsConfig
  /**
   * Collection options to apply the S3 adapter to.
   */
  collections: Partial<
    Record<
      UploadCollectionSlug,
      | ({
          signedDownloads?: SignedDownloadsConfig
        } & Omit<CollectionOptions, 'adapter'>)
      | true
    >
  >
  /**
   * AWS S3 client configuration. Highly dependent on your AWS setup.
   *
   * [AWS.S3ClientConfig Docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/s3clientconfig.html)
   */
  config: AWS.S3ClientConfig

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
   * Use pre-signed URLs for files downloading. Can be overriden per-collection.
   */
  signedDownloads?: SignedDownloadsConfig
  /**
   * When true, the collection-level prefix and document-level prefix are combined
   * (compositional). When false (default), document prefix overrides collection
   * prefix entirely.
   *
   * Example:
   * - collection prefix: `collection-prefix/`
   * - document prefix: `document-prefix/`
   * - resulting prefix with useCompositePrefixes=true: `collection-prefix/document-prefix/`
   * - resulting prefix with useCompositePrefixes=false: `document-prefix/`
   *
   * @default false
   */
  useCompositePrefixes?: boolean
}

type S3StoragePlugin = (storageS3Args: S3StorageOptions) => Plugin

const s3Clients = new Map<string, AWS.S3>()

const defaultRequestHandlerOpts: NodeHttpHandlerOptions = {
  httpAgent: {
    keepAlive: true,
    maxSockets: 100,
  },
  httpsAgent: {
    keepAlive: true,
    maxSockets: 100,
  },
}

export const s3Storage: S3StoragePlugin =
  (s3StorageOptions: S3StorageOptions) =>
  (incomingConfig: Config): Config => {
    const cacheKey = s3StorageOptions.clientCacheKey || `s3:${s3StorageOptions.bucket}`

    const getStorageClient: () => AWS.S3 = () => {
      if (s3Clients.has(cacheKey)) {
        return s3Clients.get(cacheKey)!
      }

      s3Clients.set(
        cacheKey,
        new AWS.S3({
          requestHandler: defaultRequestHandlerOpts,
          ...(s3StorageOptions.config ?? {}),
        }),
      )

      return s3Clients.get(cacheKey)!
    }

    const isPluginDisabled = s3StorageOptions.enabled === false

    initClientUploads({
      clientHandler: '@payloadcms/storage-s3/client#S3ClientUploadHandler',
      collections: s3StorageOptions.collections,
      config: incomingConfig,
      enabled: !isPluginDisabled && Boolean(s3StorageOptions.clientUploads),
      serverHandler: getGenerateSignedURLHandler({
        access:
          typeof s3StorageOptions.clientUploads === 'object'
            ? s3StorageOptions.clientUploads.access
            : undefined,
        acl: s3StorageOptions.acl,
        bucket: s3StorageOptions.bucket,
        collections: s3StorageOptions.collections,
        getStorageClient,
        useCompositePrefixes: s3StorageOptions.useCompositePrefixes,
      }),
      serverHandlerPath: '/storage-s3-generate-signed-url',
    })

    if (isPluginDisabled) {
      // If alwaysInsertFields is true, still call cloudStoragePlugin to insert fields
      if (s3StorageOptions.alwaysInsertFields) {
        // Build collections with adapter: null since plugin is disabled
        const collectionsWithoutAdapter: CloudStoragePluginOptions['collections'] = Object.entries(
          s3StorageOptions.collections,
        ).reduce(
          (acc, [slug, collOptions]) => ({
            ...acc,
            [slug]: {
              ...(collOptions === true ? {} : collOptions),
              adapter: null,
            },
          }),
          {} as Record<string, CollectionOptions>,
        )

        return cloudStoragePlugin({
          alwaysInsertFields: true,
          collections: collectionsWithoutAdapter,
          enabled: false,
          useCompositePrefixes: s3StorageOptions.useCompositePrefixes,
        })(incomingConfig)
      }

      return incomingConfig
    }

    // Determine signedDownloads for this collection
    const resolveSignedDownloads = (slug: string): SignedDownloadsConfig => {
      const collectionStorageConfig = s3StorageOptions.collections[slug]

      let signedDownloads: null | SignedDownloadsConfig =
        typeof collectionStorageConfig === 'object'
          ? (collectionStorageConfig.signedDownloads ?? false)
          : null

      if (signedDownloads === null) {
        signedDownloads = s3StorageOptions.signedDownloads ?? false
      }

      return signedDownloads
    }

    // Add adapter to each collection option object
    const collectionsWithAdapter: CloudStoragePluginOptions['collections'] = Object.entries(
      s3StorageOptions.collections,
    ).reduce(
      (acc, [slug, collOptions]) => ({
        ...acc,
        [slug]: {
          ...(collOptions === true ? {} : collOptions),
          adapter: createS3Adapter({
            acl: s3StorageOptions.acl,
            bucket: s3StorageOptions.bucket,
            clientUploads: s3StorageOptions.clientUploads,
            config: s3StorageOptions.config,
            getStorageClient,
            signedDownloads: resolveSignedDownloads(slug),
            useCompositePrefixes: s3StorageOptions.useCompositePrefixes,
          }),
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
      alwaysInsertFields: s3StorageOptions.alwaysInsertFields,
      collections: collectionsWithAdapter,
      useCompositePrefixes: s3StorageOptions.useCompositePrefixes,
    })(config)
  }
