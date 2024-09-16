import type { StorageOptions } from '@google-cloud/storage'

import { Storage } from '@google-cloud/storage'

import type { Adapter, GeneratedAdapter } from '../../types.js'

import { getGenerateURL } from './generateURL.js'
import { getHandleDelete } from './handleDelete.js'
import { getHandleUpload } from './handleUpload.js'
import { getHandler } from './staticHandler.js'

export interface Args {
  acl?: 'Private' | 'Public'
  bucket: string
  options: StorageOptions
}

/**
 * @deprecated Use [`@payloadcms/storage-gcs`](https://www.npmjs.com/package/@payloadcms/storage-gcs) instead.
 *
 * This adapter has been superceded by `@payloadcms/storage-gcs` and will be removed in Payload 3.0.
 */
export const gcsAdapter =
  ({ acl, bucket, options }: Args): Adapter =>
  ({ collection, prefix }): GeneratedAdapter => {
    if (!Storage) {
      throw new Error(
        'The package @google-cloud/storage is not installed, but is required for the plugin-cloud-storage GCS adapter. Please install it.',
      )
    }

    let storageClient: null | Storage = null

    const getStorageClient = (): Storage => {
      if (storageClient) {
        return storageClient
      }
      try {
        storageClient = new Storage(options)
      } catch (error) {
        if (/is not a constructor$/.test(error.message)) {
          throw new Error(
            'The package @google-cloud/storage is not installed, but is required for the plugin-cloud-storage GCS adapter. Please install it.',
          )
        }
        // Re-throw other unexpected errors.
        throw error
      }
      return storageClient
    }

    return {
      name: 'gcs',
      generateURL: getGenerateURL({ bucket, getStorageClient }),
      handleDelete: getHandleDelete({ bucket, getStorageClient }),
      handleUpload: getHandleUpload({
        acl,
        bucket,
        collection,
        getStorageClient,
        prefix,
      }),
      staticHandler: getHandler({ bucket, collection, getStorageClient }),
    }
  }
