import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types'
import type { TypeWithID } from 'payload/types'
import type { UTApi } from 'uploadthing/server'

interface Args {
  utApi: UTApi
}

const getKeyFromFilename = (doc: TypeWithID, filename: string) => {
  if ('filename' in doc && doc.filename === filename && '_key' in doc) {
    return doc._key
  }
  if ('sizes' in doc) {
    const sizes = doc.sizes
    if (typeof sizes === 'object' && sizes !== null) {
      for (const size of Object.values(sizes)) {
        if (size?.filename === filename && '_key' in size) {
          return size._key
        }
      }
    }
  }
}

export const getHandler = ({ utApi }: Args): StaticHandler => {
  return async (req, { doc, params: { filename } }) => {
    try {
      const key = getKeyFromFilename(doc, filename)
      const { url: signedURL } = await utApi.getSignedURL(key)

      if (!signedURL) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      const response = await fetch(signedURL)

      if (!response.ok) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      const blob = await response.blob()

      return new Response(blob, {
        headers: new Headers({
          'Content-Length': String(blob.size),
          'Content-Type': blob.type,
        }),
        status: 200,
      })
    } catch (err) {
      req.payload.logger.error({ err, msg: 'Unexpected error in staticHandler' })
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}
