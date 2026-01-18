import type { StaticHandler } from '@ruya.sa/plugin-cloud-storage/types'
import type { Where } from '@ruya.sa/payload'
import type { UTApi } from 'uploadthing/server'

import { getRangeRequestInfo } from '@ruya.sa/payload/internal'

import { getKeyFromFilename } from './utilities.js'

type Args = {
  utApi: UTApi
}

export const getHandler = ({ utApi }: Args): StaticHandler => {
  return async (
    req,
    { doc, headers: incomingHeaders, params: { clientUploadContext, collection, filename } },
  ) => {
    try {
      let key: string
      const collectionConfig = req.payload.collections[collection]?.config

      if (
        clientUploadContext &&
        typeof clientUploadContext === 'object' &&
        'key' in clientUploadContext &&
        typeof clientUploadContext.key === 'string'
      ) {
        key = clientUploadContext.key
      } else {
        let retrievedDoc = doc

        if (!retrievedDoc) {
          const or: Where[] = [
            {
              filename: {
                equals: filename,
              },
            },
          ]

          if (collectionConfig?.upload.imageSizes) {
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

        key = getKeyFromFilename(retrievedDoc, filename)!
      }

      if (!key) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      const { url: signedURL } = await utApi.getSignedURL(key)

      if (!signedURL) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      // Get file metadata first for range validation
      const headResponse = await fetch(signedURL, { method: 'HEAD' })
      if (!headResponse.ok) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      const fileSize = Number(headResponse.headers.get('content-length'))

      // Handle range request
      const rangeHeader = req.headers.get('range')
      const rangeResult = getRangeRequestInfo({ fileSize, rangeHeader })

      if (rangeResult.type === 'invalid') {
        return new Response(null, {
          headers: new Headers(rangeResult.headers),
          status: rangeResult.status,
        })
      }

      const response = await fetch(signedURL, {
        headers:
          rangeResult.type === 'partial'
            ? { Range: `bytes=${rangeResult.rangeStart}-${rangeResult.rangeEnd}` }
            : undefined,
      })

      if (!response.ok || !response.body) {
        return new Response(null, { status: 404, statusText: 'Not Found' })
      }

      const etagFromHeaders = req.headers.get('etag') || req.headers.get('if-none-match')
      const objectEtag = response.headers.get('etag')

      let headers = new Headers(incomingHeaders)

      // Add range-related headers from the result
      for (const [key, value] of Object.entries(rangeResult.headers)) {
        headers.append(key, value)
      }

      const contentType = response.headers.get('content-type')
      if (contentType) {
        headers.append('Content-Type', contentType)
      }

      if (objectEtag) {
        headers.append('ETag', objectEtag)
      }

      if (
        collectionConfig?.upload &&
        typeof collectionConfig.upload === 'object' &&
        typeof collectionConfig.upload.modifyResponseHeaders === 'function'
      ) {
        headers = collectionConfig.upload.modifyResponseHeaders({ headers }) || headers
      }

      if (etagFromHeaders && etagFromHeaders === objectEtag) {
        return new Response(null, {
          headers,
          status: 304,
        })
      }

      return new Response(response.body, {
        headers,
        status: rangeResult.status,
      })
    } catch (err) {
      req.payload.logger.error({ err, msg: 'Unexpected error in staticHandler' })
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}
