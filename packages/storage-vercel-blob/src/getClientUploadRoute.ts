import type { PayloadHandler, PayloadRequest, UploadCollectionSlug } from 'payload'

import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { APIError, Forbidden } from 'payload'

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
    addRandomSuffix,
    cacheControlMaxAge,
    collections,
    token,
    useCompositePrefixes,
  }: Args): PayloadHandler =>
  async (req) => {
    const body = (await req.json!()) as HandleUploadBody

    try {
      const jsonResponse = await handleUpload({
        body,
        onBeforeGenerateToken: async (pathname: string, collectionSlug: null | string) => {
          if (!collectionSlug || !Object.hasOwn(collections, collectionSlug)) {
            throw new APIError('No payload was provided')
          }

          if (!(await access({ collectionSlug, req }))) {
            throw new Forbidden()
          }

          const allowOverwrite = await authorizeClientOverwrite({
            collections,
            fileKey: pathname,
            req,
            requestedCollectionSlug: collectionSlug,
            useCompositePrefixes,
          })

          return {
            addRandomSuffix,
            ...(allowOverwrite && { allowOverwrite: true }),
            cacheControlMaxAge,
          }
        },
        onUploadCompleted: async () => {},
        request: req as Request,
        token,
      })

      return Response.json(jsonResponse)
    } catch (error) {
      req.payload.logger.error(error)
      throw new APIError('storage-vercel-blob client upload route error')
    }
  }
