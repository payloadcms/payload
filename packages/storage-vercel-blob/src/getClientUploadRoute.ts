import type { PayloadHandler, PayloadRequest, UploadCollectionSlug } from 'payload'

import {
  buildStoragePathData,
  resolveSignedURLKey,
  verifyClientUploadReceiptForFileKey,
} from '@payloadcms/plugin-cloud-storage/utilities'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { APIError, Forbidden } from 'payload'
import {
  assertClientUploadAccess,
  assertClientUploadAllowed,
  createClientUploadReceipt,
} from 'payload/internal'

import type { VercelBlobCollectionOptions } from './authorizeFileOverwrite.js'

import { authorizeClientOverwrite } from './authorizeFileOverwrite.js'

type Args = {
  access?: (args: {
    collectionSlug: UploadCollectionSlug
    req: PayloadRequest
  }) => boolean | Promise<boolean>
  addRandomSuffix?: boolean
  cacheControlMaxAge?: number
  collections: VercelBlobCollectionOptions
  token: string
  useCompositePrefixes?: boolean
}

const defaultAccess: Args['access'] = ({ req }) => !!req.user

export const getClientUploadRoute =
  ({
    access = defaultAccess,
    cacheControlMaxAge,
    collections,
    token,
    useCompositePrefixes,
  }: Args): PayloadHandler =>
  async (req) => {
    try {
      if (req.searchParams.get('issue-client-upload') === '1') {
        const { collectionSlug, docPrefix, filename, mimeType } = (await req.json!()) as {
          collectionSlug?: unknown
          docPrefix?: unknown
          filename?: unknown
          mimeType?: unknown
        }
        if (
          typeof collectionSlug !== 'string' ||
          typeof filename !== 'string' ||
          typeof mimeType !== 'string' ||
          (docPrefix !== undefined && typeof docPrefix !== 'string') ||
          !Object.hasOwn(collections, collectionSlug)
        ) {
          throw new APIError('Invalid upload payload', 400)
        }

        await assertClientUploadAccess({ collectionSlug, req })

        if (!(await access({ collectionSlug, req }))) {
          throw new Forbidden()
        }
        assertClientUploadAllowed({
          collection: req.payload.collections[collectionSlug]?.config,
          filename,
          mimeType,
        })
        const collectionConfig = collections[collectionSlug]
        const collectionPrefix =
          (typeof collectionConfig === 'object' && collectionConfig.prefix) || ''
        const requested = buildStoragePathData({
          collectionPrefix,
          docPrefix,
          filename,
          useCompositePrefixes,
        })
        const allowOverwrite = await authorizeClientOverwrite({
          collectionPrefix,
          collections,
          req,
          requestedCollectionSlug: collectionSlug,
          requestedFilename: requested.sanitizedFilename,
          requestedStorageFilePath: requested.storageFilePath,
          useCompositePrefixes,
        })
        const resolved = allowOverwrite
          ? {
              ...requested,
              clientUploadContext: {
                allowOverwrite: true,
                prefix: requested.sanitizedDocPrefix,
                signedReceipt: createClientUploadReceipt({
                  collectionSlug,
                  context: {
                    allowOverwrite: true,
                    prefix: requested.sanitizedDocPrefix,
                  },
                  filename: requested.sanitizedFilename,
                  req,
                }),
              },
            }
          : await resolveSignedURLKey({
              collectionPrefix,
              collectionSlug,
              docPrefix,
              filename,
              req,
              useCompositePrefixes,
            })
        return Response.json({
          clientUploadContext: resolved.clientUploadContext,
          filename: resolved.sanitizedFilename,
          pathname: resolved.storageFilePath,
        })
      }

      const body = (await req.json!()) as HandleUploadBody
      const jsonResponse = await handleUpload({
        body,
        onBeforeGenerateToken: async (pathname: string, clientPayload: null | string) => {
          if (!clientPayload) {
            throw new APIError('No payload was provided')
          }

          let parsed: { collectionSlug?: unknown; mimeType?: unknown; signedReceipt?: unknown }
          try {
            parsed = JSON.parse(clientPayload) as {
              collectionSlug?: unknown
              mimeType?: unknown
              signedReceipt?: unknown
            }
          } catch {
            parsed = { collectionSlug: clientPayload }
          }

          if (
            typeof parsed.collectionSlug !== 'string' ||
            !parsed.collectionSlug ||
            (parsed.mimeType !== undefined && typeof parsed.mimeType !== 'string') ||
            typeof parsed.signedReceipt !== 'string'
          ) {
            throw new APIError('Invalid upload payload', 400)
          }

          const { collectionSlug, mimeType, signedReceipt } = parsed

          await assertClientUploadAccess({ collectionSlug, req })

          if (!Object.hasOwn(collections, collectionSlug)) {
            throw new APIError('Invalid upload payload', 400)
          }

          if (!(await access({ collectionSlug, req }))) {
            throw new Forbidden()
          }
          const collectionConfig = collections[collectionSlug]
          const collectionPrefix =
            (typeof collectionConfig === 'object' && collectionConfig.prefix) || ''
          const receipt = verifyClientUploadReceiptForFileKey({
            collectionPrefix,
            collectionSlug,
            expectedFileKey: pathname,
            req,
            signedReceipt,
            useCompositePrefixes,
          })

          assertClientUploadAllowed({
            collection: req.payload.collections[collectionSlug]?.config,
            filename: pathname,
            mimeType,
          })

          return {
            addRandomSuffix: false,
            ...(mimeType ? { allowedContentTypes: [mimeType] } : {}),
            ...(receipt.context.allowOverwrite === true && { allowOverwrite: true }),
            cacheControlMaxAge,
          }
        },
        onUploadCompleted: async () => {},
        request: req as Request,
        token,
      })

      return Response.json(jsonResponse)
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }

      req.payload.logger.error(error)
      throw new APIError('storage-vercel-blob client upload route error')
    }
  }
