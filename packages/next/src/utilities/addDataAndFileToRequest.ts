import type { BasePayloadRequest, PayloadRequestWithData } from 'payload/types'

import type { NextFileUploadOptions } from '../next-fileupload/index.js'

import { nextFileUpload } from '../next-fileupload/index.js'

type ReturnType = BasePayloadRequest & PayloadRequestWithData
type AddDataAndFileToRequest = (args: { request: BasePayloadRequest }) => Promise<ReturnType>

/**
 * Mutates the Request to contain 'data' and 'file' if present
 */
export const addDataAndFileToRequest: AddDataAndFileToRequest = async ({ request }) => {
  const config = request.payload.config
  let data: Record<string, any> | undefined = undefined
  let file: PayloadRequestWithData['file'] = undefined

  if (
    request.method &&
    ['PATCH', 'POST', 'PUT'].includes(request.method.toUpperCase()) &&
    request.body
  ) {
    // @ts-expect-error todo: fix type
    const request = new Request(incomingRequest)
    const [contentType] = (request.headers.get('Content-Type') || '').split(';')

    if (contentType === 'application/json') {
      const bodyByteSize = parseInt(request.headers.get('Content-Length') || '0', 10)
      const upperByteLimit =
        typeof config.upload?.limits?.fieldSize === 'number'
          ? config.upload.limits.fields
          : undefined
      if ((upperByteLimit && bodyByteSize <= upperByteLimit) || upperByteLimit === undefined) {
        try {
          data = await request.json()
        } catch (error) {
          data = {}
        }
      } else {
        throw new Error('Request body size exceeds the limit')
      }
    } else {
      if (request.headers.has('Content-Length') && request.headers.get('Content-Length') !== '0') {
        const { error, fields, files } = await nextFileUpload({
          options: config.upload as NextFileUploadOptions,
          request,
        })

        if (error) {
          throw new Error(error.message)
        }

        if (files?.file) {
          file = files.file
        }

        if (fields?._payload && typeof fields._payload === 'string') {
          data = JSON.parse(fields._payload)
        }
      }
    }
  }

  const mutableRequest = request as ReturnType
  if (data) {
    mutableRequest.data = data
    mutableRequest.json = () => Promise.resolve(data)
  }
  if (file) mutableRequest.file = file

  return mutableRequest
}
