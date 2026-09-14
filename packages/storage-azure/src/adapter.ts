import type { ContainerClient } from '@azure/storage-blob'
import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import { deleteFile } from './deleteFile.js'
import { generateUploadInstructions } from './generateUploadInstructions.js'
import { generateURL } from './generateURL.js'
import { getFile } from './getFile.js'
import { isClientUploadAllowed } from './isClientUploadAllowed.js'
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

    generateURL: ({ filename, prefix: urlPrefix = '' }) =>
      generateURL({
        baseURL,
        collectionPrefix: prefix,
        containerName,
        filename,
        prefix: urlPrefix,
        useCompositePrefixes,
      }),

    uploadInstructions: {
      adminHandler: {
        path: '@payloadcms/storage-azure/client#AzureClientUploadHandler',
      },
      enabled: Boolean(clientUploads) && isClientUploadAllowed(collection),
      generate: generateUploadInstructions({
        access: typeof clientUploads === 'object' ? clientUploads.access : undefined,
        collectionPrefix: prefix,
        containerName,
        getStorageClient,
        useCompositePrefixes,
      }),
      requiresUploadReceipt: true,
      useInAdmin: true,
    },

    handleDelete: ({ doc: { prefix: docPrefix = '' }, filename }) =>
      deleteFile({
        client: getStorageClient(),
        collectionPrefix: prefix,
        docPrefix,
        filename,
        useCompositePrefixes,
      }),

    handleUpload: async ({ data, file }) => {
      await uploadFile({
        buffer: file.buffer,
        client: getStorageClient(),
        collectionPrefix: prefix,
        docPrefix: data.prefix,
        filename: file.filename,
        mimeType: file.mimeType,
        tempFilePath: file.tempFilePath,
        useCompositePrefixes,
      })

      return data
    },

    staticHandler: (
      req,
      { doc, headers, params: { filename, prefix: prefixQueryParam, uploadReference } },
    ) =>
      getFile({
        client: getStorageClient(),
        collection,
        collectionPrefix: prefix,
        doc,
        filename,
        incomingHeaders: headers,
        prefixQueryParam,
        req,
        uploadReference,
        useCompositePrefixes,
      }),

    ...(allowContainerCreate && { onInit: createContainerIfNotExists }),
  })
}
