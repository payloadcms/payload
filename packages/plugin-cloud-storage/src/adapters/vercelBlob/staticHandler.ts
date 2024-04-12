import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types'
import type { CollectionConfig, PayloadRequest, UploadConfig } from 'payload/types'

import { head } from '@vercel/blob'
import path from 'path'

type StaticHandlerArgs = {
  baseUrl: string
  token: string
}

export const getStaticHandler = (
  { baseUrl, token }: StaticHandlerArgs,
  collection: CollectionConfig,
): StaticHandler => {
  return async (req, { params: { filename } }) => {
    try {
      const prefix = await getFilePrefix({ collection, req })

      const fileUrl = `${baseUrl}/${path.posix.join(prefix, filename)}`

      const blobMetadata = await head(fileUrl, { token })
      if (!blobMetadata) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      const { contentDisposition, contentType, size } = blobMetadata
      const response = await fetch(fileUrl)
      const blob = await response.blob()

      if (!blob) {
        return new Response(null, { status: 204, statusText: 'No Content' })
      }

      const bodyBuffer = await blob.arrayBuffer()

      return new Response(bodyBuffer, {
        headers: new Headers({
          'Content-Disposition': contentDisposition,
          'Content-Length': String(size),
          'Content-Type': contentType,
        }),
        status: 200,
      })
    } catch (err: unknown) {
      req.payload.logger.error({ err, msg: 'Unexpected error in staticHandler' })
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}

async function getFilePrefix({
  collection,
  req,
}: {
  collection: CollectionConfig
  req: PayloadRequest
}): Promise<string> {
  const imageSizes = (collection?.upload as UploadConfig)?.imageSizes || []
  const { routeParams } = req
  const filename = routeParams?.['filename']

  const files = await req.payload.find({
    collection: collection.slug,
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      or: [
        {
          filename: { equals: filename },
        },
        ...imageSizes.map((imageSize) => ({
          [`sizes.${imageSize.name}.filename`]: { equals: filename },
        })),
      ],
    },
  })
  const prefix = files?.docs?.[0]?.prefix
  return prefix ? (prefix as string) : ''
}
