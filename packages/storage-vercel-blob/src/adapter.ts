import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import { resolveSignedURLKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client'

import { deleteFile } from './deleteFile.js'
import { generateURL } from './generateURL.js'
import { getFile } from './getFile.js'
import { uploadFile } from './uploadFile.js'

interface CreateVercelBlobAdapterArgs {
  access: 'public'
  addRandomSuffix?: boolean
  baseUrl: string
  cacheControlMaxAge: number
  clientUploads?: ClientUploadsConfig
  token: string
  useCompositePrefixes?: boolean
}

export function createVercelBlobAdapter({
  access,
  addRandomSuffix,
  baseUrl,
  cacheControlMaxAge,
  clientUploads,
  token,
  useCompositePrefixes = false,
}: CreateVercelBlobAdapterArgs): Adapter {
  return ({ collection, prefix = '' }): GeneratedAdapter => ({
    name: 'vercel-blob',

    uploadInstructions: clientUploads
      ? {
          access: typeof clientUploads === 'object' ? clientUploads.access : undefined,
          adminHandler: {
            path: '@payloadcms/storage-vercel-blob/client#VercelBlobClientUploadHandler',
          },
          generate: async ({ collectionSlug, docPrefix, filename, filesize, mimeType, req }) => {
            const resolved = await resolveSignedURLKey({
              collectionPrefix: prefix,
              collectionSlug,
              docPrefix,
              filename,
              req,
              useCompositePrefixes,
            })

            return {
              name: 'uploadToVercelBlob',
              type: 'dispatch',
              data: {
                pathname: resolved.fileKey,
                token: await generateClientTokenFromReadWriteToken({
                  addRandomSuffix,
                  allowedContentTypes: mimeType ? [mimeType] : undefined,
                  cacheControlMaxAge,
                  maximumSizeInBytes: filesize,
                  pathname: resolved.fileKey,
                  token,
                }),
              },
              file: {
                directUpload: { prefix: resolved.sanitizedDocPrefix },
                filename: resolved.sanitizedFilename,
                mimeType,
                size: filesize,
              },
            }
          },
        }
      : undefined,

    generateURL: ({ filename, prefix: urlPrefix = '' }) =>
      generateURL({
        baseUrl,
        collectionPrefix: prefix,
        filename,
        prefix: urlPrefix,
        useCompositePrefixes,
      }),

    handleDelete: ({ doc: { prefix: docPrefix = '' }, filename }) =>
      deleteFile({
        baseUrl,
        collectionPrefix: prefix,
        docPrefix,
        filename,
        token,
        useCompositePrefixes,
      }),

    handleUpload: async ({ data, file: { buffer, filename, mimeType } }) => {
      const result = await uploadFile({
        access,
        addRandomSuffix,
        buffer,
        cacheControlMaxAge,
        collectionPrefix: prefix,
        docPrefix: data.prefix,
        filename,
        mimeType,
        token,
        useCompositePrefixes,
      })

      if (result.filename) {
        data.filename = result.filename
      }

      return data
    },

    staticHandler: (
      req,
      { headers, params: { directUpload, filename, prefix: prefixQueryParam } },
    ) =>
      getFile({
        baseUrl,
        cacheControlMaxAge,
        collection,
        collectionPrefix: prefix,
        directUpload,
        filename,
        incomingHeaders: headers,
        prefixQueryParam,
        req,
        token,
        useCompositePrefixes,
      }),
  })
}
