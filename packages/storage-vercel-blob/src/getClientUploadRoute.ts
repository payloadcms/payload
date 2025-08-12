import type { PayloadHandler, PayloadRequest, UploadCollectionSlug } from 'payload'

import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { APIError, Forbidden } from 'payload'

type Args = {
  access?: (args: {
    collectionSlug: UploadCollectionSlug
    req: PayloadRequest
  }) => boolean | Promise<boolean>
  addRandomSuffix?: boolean
  cacheControlMaxAge?: number
  token: string
}

const defaultAccess: Args['access'] = ({ req }) => !!req.user

export const getClientUploadRoute =
  ({ access = defaultAccess, addRandomSuffix, cacheControlMaxAge, token }: Args): PayloadHandler =>
  async (req) => {
    const body = (await req.json!()) as HandleUploadBody

    try {
      const jsonResponse = await handleUpload({
        body,
        onBeforeGenerateToken: async (_pathname: string, collectionSlug: null | string) => {
          if (!collectionSlug) {
            throw new APIError('No payload was provided')
          }

          if (!(await access({ collectionSlug, req }))) {
            throw new Forbidden()
          }

          return Promise.resolve({
            addRandomSuffix,
            cacheControlMaxAge,
          })
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
