import type { ContainerClient } from '@azure/storage-blob'
import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import { deleteFile } from './deleteFile.js'
import { generateURL } from './generateURL.js'
import { getFile } from './getFile.js'
import { uploadFile } from './uploadFile.js'

interface CreateAzureAdapterArgs {
  allowContainerCreate: boolean
  baseURL: string
  clientUploads?: ClientUploadsConfig
  containerName: string
  createContainerIfNotExists: () => void
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
    clientUploads,

    generateURL: ({ filename, prefix: urlPrefix = '' }) =>
      generateURL({
        baseURL,
        collectionPrefix: prefix,
        containerName,
        filename,
        prefix: urlPrefix,
        useCompositePrefixes,
      }),

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
      { headers, params: { clientUploadContext, filename, prefix: prefixQueryParam } },
    ) =>
      getFile({
        client: getStorageClient(),
        clientUploadContext,
        collection,
        collectionPrefix: prefix,
        filename,
        incomingHeaders: headers,
        prefixQueryParam,
        req,
        useCompositePrefixes,
      }),

    ...(allowContainerCreate && { onInit: createContainerIfNotExists }),
  })
}
