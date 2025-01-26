import type {
  Adapter,
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'
import type { Config, Plugin, UploadCollectionSlug } from 'payload'

import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'

import { getGenerateUrl } from './generateURL.js'
import { getHandleDelete } from './handleDelete.js'
import { getHandleUpload } from './handleUpload.js'
import { getStaticHandler } from './staticHandler.js'

export type VercelBlobStorageOptions = {
  /**
   * Access control level. Currently, only 'public' is supported.
   * Vercel plans on adding support for private blobs in the future.
   *
   * @default 'public'
   */
  access?: 'public'

  /**
   * Add a random suffix to the uploaded file name in Vercel Blob storage
   *
   * @default false
   */
  addRandomSuffix?: boolean

  /**
   * Cache-Control max-age in seconds
   *
   * @defaultvalue 365 * 24 * 60 * 60 (1 Year)
   */
  cacheControlMaxAge?: number

  /**
   * Collections to apply the Vercel Blob adapter to
   */
  collections: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>

  /**
   * Whether or not to enable the plugin
   *
   * Default: true
   */
  enabled?: boolean

  /**
   * Vercel Blob storage read/write token
   *
   * Usually process.env.BLOB_READ_WRITE_TOKEN set by Vercel
   *
   * If unset, the plugin will be disabled and will fallback to local storage
   */
  token: string | undefined
}

const defaultUploadOptions: Partial<VercelBlobStorageOptions> = {
  access: 'public',
  addRandomSuffix: false,
  cacheControlMaxAge: 60 * 60 * 24 * 365, // 1 year
  enabled: true,
}

type VercelBlobStoragePlugin = (vercelBlobStorageOpts: VercelBlobStorageOptions) => Plugin

export const vercelBlobStorage: VercelBlobStoragePlugin =
  (options: VercelBlobStorageOptions) =>
  (incomingConfig: Config): Config => {
    // If the plugin is disabled or no token is provided, do not enable the plugin
    if (options.enabled === false || !options.token) {
      return incomingConfig
    }

    // Parse storeId from token
    const storeId = options.token.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)?.[1]?.toLowerCase()

    if (!storeId) {
      throw new Error(
        'Invalid token format for Vercel Blob adapter. Should be vercel_blob_rw_<store_id>_<random_string>.',
      )
    }

    const optionsWithDefaults = {
      ...defaultUploadOptions,
      ...options,
    }

    const baseUrl = `https://${storeId}.${optionsWithDefaults.access}.blob.vercel-storage.com`

    const adapter = vercelBlobStorageInternal({ ...optionsWithDefaults, baseUrl })

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

function vercelBlobStorageInternal(
  options: { baseUrl: string } & VercelBlobStorageOptions,
): Adapter {
  return ({ collection, prefix }): GeneratedAdapter => {
    const { access, addRandomSuffix, baseUrl, cacheControlMaxAge, token } = options

    if (!token) {
      throw new Error('Vercel Blob storage token is required')
    }

    return {
      name: 'vercel-blob',
      generateURL: getGenerateUrl({ baseUrl, prefix }),
      handleDelete: getHandleDelete({ baseUrl, prefix, token }),
      handleUpload: getHandleUpload({
        access,
        addRandomSuffix,
        baseUrl,
        cacheControlMaxAge,
        prefix,
        token,
      }),
      staticHandler: getStaticHandler({ baseUrl, cacheControlMaxAge, token }, collection),
    }
  }
}
