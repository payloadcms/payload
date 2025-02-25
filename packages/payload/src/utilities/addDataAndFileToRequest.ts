// @ts-strict-ignore
import type { PayloadRequest } from '../types/index.js'

import { APIError } from '../errors/APIError.js'
import { fetchAPIFileUpload } from '../uploads/fetchAPI-multipart/index.js'

type AddDataAndFileToRequest = (req: PayloadRequest) => Promise<void>

/**
 * Mutates the Request, appending 'data' and 'file' if found
 */
export const addDataAndFileToRequest: AddDataAndFileToRequest = async (req) => {
  const { body, headers, method, payload } = req

  if (method && ['PATCH', 'POST', 'PUT'].includes(method.toUpperCase()) && body) {
    const [contentType] = (headers.get('Content-Type') || '').split(';')
    const bodyByteSize = parseInt(req.headers.get('Content-Length') || '0', 10)

    if (contentType === 'application/json') {
      let data = {}
      try {
        const text = await req.text()
        data = text ? JSON.parse(text) : {}
      } catch (error) {
        req.payload.logger.error(error)
      } finally {
        req.data = data
        req.json = () => Promise.resolve(data)
      }
    } else if (bodyByteSize && contentType.includes('multipart/')) {
      const { error, fields, files } = await fetchAPIFileUpload({
        options: payload.config.upload,
        request: req as Request,
      })

      if (error) {
        throw new APIError(error.message)
      }

      if (files?.file) {
        req.file = files.file
      }

      if (fields?._payload && typeof fields._payload === 'string') {
        req.data = JSON.parse(fields._payload)
      }
    }
  }
}
