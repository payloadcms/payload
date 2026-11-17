import type { ContainerClient } from '@azure/storage-blob'
import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import { deleteFile } from './deleteFile.js'
import { generateURL } from './generateURL.js'
import { getFile } from './getFile.js'
import { isAzureClientUploadAllowed } from './isClientUploadAllowed.js'
import { uploadFile } from './uploadFile.js'

interface CreateAzureAdapterArgs {
  allowContainerCreate: boolean
  baseURL: string
  clientUploads?: ClientUploadsConfig
  containerName: string
  createContainerIfNotExists: () => Promise<void> | void
  getStorageClient: () => ContainerClient
  useCompositePrefixes?: boolean
}

export function createAzureAdapter({
  allowContainerCreate,
  baseURL,
  clientUploads,
  containerName,
  createContainerIfNotExists,
  getStorageClient,
  useCompositePrefixes = false,
}: CreateAzureAdapterArgs): Adapter {
  return ({ collection, prefix = '' }): GeneratedAdapter => ({
    name: 'azure',
    clientUploads: isAzureClientUploadAllowed(collection) ? clientUploads : false,
    requiresClientUploadReceipt: true,

    generateURL: ({ filename, prefix: urlPrefix = '' }) =>
      generateURL({
        baseURL,
        collectionPrefix: prefix,
        containerName,
        filename,
        prefix: urlPrefix,
        useCompositePrefixes,
      }),

    handleDelete: ({ storageFilePath }) =>
      deleteFile({
        client: getStorageClient(),
        storageFilePath,
      }),

    handleUpload: async ({ data, file, storageFilePath }) => {
      await uploadFile({
        buffer: file.buffer,
        client: getStorageClient(),
        mimeType: file.mimeType,
        storageFilePath,
        tempFilePath: file.tempFilePath,
      })

      return data
    },

    staticHandler: (req, { doc, headers, params: { clientUploadContext, filename } }) =>
      getFile({
        client: getStorageClient(),
        clientUploadContext,
        collection,
        collectionPrefix: prefix,
        doc,
        filename,
        incomingHeaders: headers,
        req,
        useCompositePrefixes,
      }),

    ...(allowContainerCreate && { onInit: createContainerIfNotExists }),
  })
}
