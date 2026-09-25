import type {
  Adapter,
  ClientUploadsConfig,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import {
  buildUploadStoragePathData,
  resolveSignedURLKey,
} from '@payloadcms/plugin-cloud-storage/utilities'
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client'
import { Forbidden } from 'payload'
import { assertClientUploadAllowed, createClientUploadReceipt } from 'payload/internal'

import type { VercelBlobCollectionSource } from './authorizeFileOverwrite.js'

import { authorizeClientOverwrite } from './authorizeFileOverwrite.js'
import { copyVercelBlobFile } from './copyFile.js'
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
  collectionSources: VercelBlobCollectionSource[]
  token: string
  useCompositePrefixes?: boolean
}

export function createVercelBlobAdapter({
  access,
  addRandomSuffix,
  baseUrl,
  cacheControlMaxAge,
  clientUploads,
  collectionSources,
  token,
  useCompositePrefixes = false,
}: CreateVercelBlobAdapterArgs): Adapter {
  const clientUploadsAccess = typeof clientUploads === 'object' ? clientUploads.access : undefined

  return ({ collection, prefix = '' }): GeneratedAdapter => ({
    name: 'vercel-blob',

    copyFile: ({ from, to }) => copyVercelBlobFile({ access, cacheControlMaxAge, from, to, token }),

    uploadInstructions: {
      adminHandler: {
        path: '@payloadcms/storage-vercel-blob/client#VercelBlobClientUploadHandler',
      },
      enabled: Boolean(clientUploads),
      generate: async ({
        collectionSlug,
        docPrefix,
        filename,
        filesize,
        mimeType,
        overrideAccess,
        req,
      }) => {
        if (
          !overrideAccess &&
          (clientUploadsAccess ? !(await clientUploadsAccess({ collectionSlug, req })) : !req.user)
        ) {
          throw new Forbidden(req.t)
        }

        assertClientUploadAllowed({ collection, filename, mimeType })

        const requested = buildUploadStoragePathData({
          collectionPrefix: prefix,
          docPrefix,
          filename,
          useCompositePrefixes,
        })
        const allowOverwrite = await authorizeClientOverwrite({
          collectionPrefix: prefix,
          collectionSources,
          overrideAccess,
          req,
          requestedCollectionSlug: collectionSlug,
          requestedFilename: requested.sanitizedFilename,
          requestedStorageFilePath: requested.storageFilePath,
        })
        const resolved = allowOverwrite
          ? {
              ...requested,
              uploadReference: {
                prefix: requested.sanitizedDocPrefix,
                signedReceipt: createClientUploadReceipt({
                  allowOverwrite: true,
                  collectionSlug,
                  filename: requested.sanitizedFilename,
                  filePrefix: requested.sanitizedDocPrefix,
                  req,
                  storageFilePath: requested.storageFilePath,
                }),
              },
            }
          : await resolveSignedURLKey({
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
            pathname: resolved.storageFilePath,
            token: await generateClientTokenFromReadWriteToken({
              addRandomSuffix: false,
              allowedContentTypes: mimeType ? [mimeType] : undefined,
              ...(allowOverwrite && { allowOverwrite: true }),
              cacheControlMaxAge,
              maximumSizeInBytes: filesize,
              pathname: resolved.storageFilePath,
              token,
            }),
          },
          file: {
            filename: resolved.sanitizedFilename,
            mimeType,
            size: filesize,
            uploadReference: resolved.uploadReference,
          },
        }
      },
      requiresUploadReceipt: true,
      useInAdmin: true,
    },

    generateURL: ({ filename, prefix: urlPrefix = '' }) =>
      generateURL({
        baseUrl,
        collectionPrefix: prefix,
        filename,
        prefix: urlPrefix,
        useCompositePrefixes,
      }),

    handleDelete: ({ storageFilePath }) =>
      deleteFile({
        baseUrl,
        storageFilePath,
        token,
      }),

    handleUpload: async ({ data, file: { buffer, mimeType }, storageFilePath }) => {
      const result = await uploadFile({
        access,
        addRandomSuffix,
        buffer,
        cacheControlMaxAge,
        mimeType,
        storageFilePath,
        token,
      })

      if (result.filename) {
        data.filename = result.filename
      }

      return data
    },

    staticHandler: (req, { doc, headers, params: { filename, operation, uploadReference } }) =>
      getFile({
        baseUrl,
        cacheControlMaxAge,
        collection,
        collectionPrefix: prefix,
        doc,
        filename,
        incomingHeaders: headers,
        operation,
        req,
        token,
        uploadReference,
        useCompositePrefixes,
      }),
  })
}
