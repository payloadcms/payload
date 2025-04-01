import {
  APIError,
  Forbidden,
  type PayloadHandler,
  type PayloadRequest,
  type UploadCollectionSlug,
} from 'payload'

type Args = {
  access?: (args: {
    collectionSlug: UploadCollectionSlug
    req: PayloadRequest
  }) => boolean | Promise<boolean>
  acl: 'private' | 'public-read'
  token?: string
}

const defaultAccess: Args['access'] = ({ req }) => !!req.user

import type { FileRouter } from 'uploadthing/server'

import { createRouteHandler } from 'uploadthing/next'
import { createUploadthing } from 'uploadthing/server'

export const getClientUploadRoute = ({
  access = defaultAccess,
  acl,
  token,
}: Args): PayloadHandler => {
  const f = createUploadthing()

  const uploadRouter = {
    uploader: f({
      blob: {
        acl,
        maxFileCount: 1,
      },
    })
      .middleware(async ({ req: rawReq }) => {
        const req = rawReq as PayloadRequest

        const collectionSlug = req.searchParams.get('collectionSlug')

        if (!collectionSlug) {
          throw new APIError('No payload was provided')
        }

        if (!(await access({ collectionSlug, req }))) {
          throw new Forbidden()
        }

        return {}
      })
      .onUploadComplete(() => {}),
  } satisfies FileRouter

  const { POST } = createRouteHandler({ config: { token }, router: uploadRouter })

  return async (req) => {
    return POST(req)
  }
}
