import type { PayloadRequest, PayloadRequestData } from 'payload/types'

import { APIError } from 'payload/errors'

import type { FetchAPIFileUploadOptions } from '../fetchAPI-multipart/index.js'

import { fetchAPIFileUpload } from '../fetchAPI-multipart/index.js'

const KB = 1024
const MB = KB * KB

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
      // body is <= 4MB
      if (bodyByteSize <= 4 * MB) {
        const formData = await mutableRequest.formData()
        mutableRequest.formData = async () => Promise.resolve(formData)

        const payloadData = formData.get('_payload')
        if (typeof payloadData === 'string') {
          mutableRequest.data = JSON.parse(payloadData)
        }

        const formFile = formData.get('file')
        if (formFile instanceof Blob) {
          const maxFileSizeLimit = config.upload.limits?.fileSize ?? undefined
          if (
            maxFileSizeLimit === undefined ||
            (maxFileSizeLimit && formFile.size <= maxFileSizeLimit)
          ) {
            const fileBytes = await formFile.arrayBuffer()
            const buffer = Buffer.from(fileBytes)

            mutableRequest.file = {
              name: formFile.name,
              data: buffer,
              mimetype: formFile.type,
              size: formFile.size,
            }
          } else if (config.upload?.abortOnLimit) {
            throw new APIError('File size limit has been reached', 413)
          }
        }
      } else {
        // body is > 4MB
        const { error, fields, files } = await fetchAPIFileUpload({
          options: config.upload as FetchAPIFileUploadOptions,
          request: mutableRequest as Request,
        })

        if (error) {
          throw new Error(error.message)
        }

        if (files?.file) {
          mutableRequest.file = files.file
        }

        if (fields?._payload && typeof fields._payload === 'string') {
          mutableRequest.data = JSON.parse(fields._payload)
        }
      }
    }

    return mutableRequest
  }

  return incomingRequest
}
