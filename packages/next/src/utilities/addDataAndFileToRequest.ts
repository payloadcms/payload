import type { PayloadRequest, PayloadRequestData } from 'payload'

import { APIError } from 'payload'

import type { FetchAPIFileUploadOptions } from '../fetchAPI-multipart/index.js'

import { fetchAPIFileUpload } from '../fetchAPI-multipart/index.js'

type ReturnType = PayloadRequest & PayloadRequestData
type AddDataAndFileToRequest = (args: { request: PayloadRequest }) => Promise<ReturnType>

/**
 * Mutates the Request to contain 'data' and 'file' if present
 */
export const addDataAndFileToRequest: AddDataAndFileToRequest = async ({
  request: incomingRequest,
}) => {
  const config = incomingRequest.payload.config

  if (
    incomingRequest.method &&
    ['PATCH', 'POST', 'PUT'].includes(incomingRequest.method.toUpperCase()) &&
    incomingRequest.body
  ) {
    const [contentType] = (incomingRequest.headers.get('Content-Type') || '').split(';')
    const mutableRequest = incomingRequest as ReturnType
    const bodyByteSize = parseInt(incomingRequest.headers.get('Content-Length') || '0', 10)

    if (contentType === 'application/json') {
      let data = {}
      try {
        data = await mutableRequest.json()
      } catch (error) {
        mutableRequest.payload.logger.error(error)
      } finally {
        mutableRequest.data = data
        mutableRequest.json = () => Promise.resolve(data)
      }
    } else if (bodyByteSize && contentType.includes('multipart/')) {
      const { error, fields, files } = await fetchAPIFileUpload({
        options: config.upload as FetchAPIFileUploadOptions,
        request: mutableRequest as Request,
      })

      if (error) {
        throw new APIError(error.message)
      }

      if (files?.file) {
        mutableRequest.file = files.file
      }

      if (fields?._payload && typeof fields._payload === 'string') {
        mutableRequest.data = JSON.parse(fields._payload)
      }
    }

    return mutableRequest
  }

  return incomingRequest
}
