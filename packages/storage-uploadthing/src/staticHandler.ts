import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types'
import type { Where } from 'payload'
import type { UTApi } from 'uploadthing/server'

import { getKeyFromFilename } from './utilities.js'

type Args = {
  utApi: UTApi
}

export const getHandler = ({ utApi }: Args): StaticHandler => {
  return async (req, { doc, params: { clientUploadContext, collection, filename } }) => {
    try {
      let key: string

      if (
        clientUploadContext &&
        typeof clientUploadContext === 'object' &&
        'key' in clientUploadContext &&
        typeof clientUploadContext.key === 'string'
      ) {
        key = clientUploadContext.key
      } else {
        const collectionConfig = req.payload.collections[collection]?.config
        let retrievedDoc = doc

        if (!retrievedDoc) {
          const or: Where[] = [
            {
              filename: {
                equals: filename,
              },
            },
          ]

          if (collectionConfig.upload.imageSizes) {
            collectionConfig.upload.imageSizes.forEach(({ name }) => {
              or.push({
                [`sizes.${name}.filename`]: {
                  equals: filename,
                },
              })
            })
          }

          const result = await req.payload.db.findOne({
            collection,
            req,
            where: { or },
          })

          if (result) {
            retrievedDoc = result
          }
        }

        if (!retrievedDoc) {
          return new Response(null, { status: 404, statusText: 'Not Found' })
        }

        key = getKeyFromFilename(retrievedDoc, filename)
      }

      if (!key) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      const { url: signedURL } = await utApi.getSignedURL(key)

      if (!signedURL) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      const response = await fetch(signedURL)

      if (!response.ok) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      const blob = await response.blob()

      const etagFromHeaders = req.headers.get('etag') || req.headers.get('if-none-match')
      const objectEtag = response.headers.get('etag')

      if (etagFromHeaders && etagFromHeaders === objectEtag) {
        return new Response(null, {
          headers: new Headers({
            'Content-Length': String(blob.size),
            'Content-Type': blob.type,
            ETag: objectEtag,
          }),
          status: 304,
        })
      }

      return new Response(blob, {
        headers: new Headers({
          'Content-Length': String(blob.size),
          'Content-Type': blob.type,
          ETag: objectEtag,
        }),
        status: 200,
      })
    } catch (err) {
      req.payload.logger.error({ err, msg: 'Unexpected error in staticHandler' })
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}
