import type { Collection, CustomPayloadRequest, SanitizedConfig } from 'payload/types'

import type { NextFileUploadOptions } from '../next-fileupload/index.js'

import { nextFileUpload } from '../next-fileupload/index.js'

type GetDataAndFile = (args: {
  collection: Collection
  config: SanitizedConfig
  request: Request
}) => Promise<{
  data: Record<string, any>
  file: CustomPayloadRequest['file']
}>
export const getDataAndFile: GetDataAndFile = async ({
  collection,
  config,
  request: incomingRequest,
}) => {
  let data: Record<string, any> = undefined
  let file: CustomPayloadRequest['file'] = undefined

  if (
    ['PATCH', 'POST', 'PUT'].includes(incomingRequest.method.toUpperCase()) &&
    incomingRequest.body
  ) {
    const request = new Request(incomingRequest)
    const [contentType] = (request.headers.get('Content-Type') || '').split(';')

    if (contentType === 'application/json') {
      const bodyByteSize = parseInt(request.headers.get('Content-Length') || '0', 10)
      const upperByteLimit =
        typeof config.upload?.limits?.fieldSize === 'number'
          ? config.upload.limits.fields
          : undefined
      if (bodyByteSize <= upperByteLimit || upperByteLimit === undefined) {
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

        if (collection?.config?.upload && files?.file) {
          file = files.file
        }

        if (fields?._payload && typeof fields._payload === 'string') {
          data = JSON.parse(fields._payload)
        }
      }
    }
  }

  return {
    data,
    file,
  }
}
