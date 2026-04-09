import type { ContainerClient } from '@azure/storage-blob'
import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import { generateURL } from './generateURL.js'
import { deleteFile } from './handleDelete.js'
import { uploadFile } from './handleUpload.js'
import { getFile } from './staticHandler.js'

interface CreateAzureAdapterArgs {
  allowContainerCreate: boolean
  baseURL: string
  clientUploads?: ClientUploadsConfig
  containerName: string
  createContainerIfNotExists: () => void
  getStorageClient: () => ContainerClient
}

export function createAzureAdapter({
  allowContainerCreate,
  baseURL,
  clientUploads,
  containerName,
  createContainerIfNotExists,
  getStorageClient,
}: CreateAzureAdapterArgs): Adapter {
  return ({ collection, prefix = '' }): GeneratedAdapter => ({
    name: 'azure',
    clientUploads,

    generateURL: ({ filename, prefix: urlPrefix = '' }) =>
      generateURL({ baseURL, containerName, filename, prefix: urlPrefix }),

    handleDelete: async ({ doc: { prefix: docPrefix = '' }, filename }) =>
      await deleteFile({ client: getStorageClient(), filename, prefix: docPrefix }),

    handleUpload: async ({ data, file }) => {
      await uploadFile({
        buffer: file.buffer,
        client: getStorageClient(),
        filename: file.filename,
        mimeType: file.mimeType,
        prefix: data.prefix || prefix,
        tempFilePath: file.tempFilePath,
      })

      return data
    },

    staticHandler: async (
      req,
      { headers, params: { clientUploadContext, filename, prefix: prefixQueryParam } },
    ) =>
      await getFile({
        client: getStorageClient(),
        clientUploadContext,
        collection,
        filename,
        incomingHeaders: headers,
        prefixQueryParam,
        req,
      }),

    ...(allowContainerCreate && { onInit: createContainerIfNotExists }),
  })
}
