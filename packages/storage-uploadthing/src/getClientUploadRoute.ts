import {
  APIError,
  Forbidden,
  type PayloadHandler,
  type PayloadRequest,
  type UploadCollectionSlug,
} from 'payload'
import { assertClientUploadAllowed } from 'payload/internal'

type Args = {
  access?: (args: {
    collectionSlug: UploadCollectionSlug
    req: PayloadRequest
  }) => boolean | Promise<boolean>
  acl: 'private' | 'public-read'
  routerInputConfig?: FileRouterInputConfig
  token?: string
}

const defaultAccess: Args['access'] = ({ req }) => !!req.user

import type { FileRouter } from 'uploadthing/server'

import { createRouteHandler } from 'uploadthing/next'
import { createUploadthing } from 'uploadthing/server'

import type { FileRouterInputConfig } from './index.js'

export const getClientUploadRoute = ({
  access = defaultAccess,
  acl,
  routerInputConfig = {},
  token,
}: Args): PayloadHandler => {
  const f = createUploadthing()

  const uploadRouter = {
    uploader: f({
      ...routerInputConfig,
      blob: {
        acl,
        maxFileCount: 1,
        maxFileSize: '512MB',
        ...('blob' in routerInputConfig ? routerInputConfig.blob : {}),
      },
    })
      .middleware(async ({ files, req: rawReq }) => {
        const req = rawReq as PayloadRequest

        const collectionSlug = req.searchParams.get('collectionSlug')

        if (!collectionSlug) {
          throw new APIError('No payload was provided')
        }

        if (!(await access({ collectionSlug, req }))) {
          throw new Forbidden()
        }

        for (const file of files) {
          assertClientUploadAllowed({
            collection: req.payload.collections[collectionSlug]?.config,
            filename: file.name,
            mimeType: file.type,
          })
        }

        return {}
      })
      .onUploadComplete(() => {}),
  } satisfies FileRouter

  const { POST } = createRouteHandler({ config: { token }, router: uploadRouter })

  return (req) => POST(req)
}
