import type { StaticHandler } from '@payloadcms/plugin-cloud-storage/types'
import type { UTApi } from 'uploadthing/server'

interface Args {
  utApi: UTApi
}

export const getHandler = ({ utApi }: Args): StaticHandler => {
  return async (req, { params: { filename } }) => {
    try {
      const fileUrl = (await utApi.getFileUrls(filename))?.data?.[0].url

      // Get buffer from file url
      const response = await fetch(fileUrl)

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
