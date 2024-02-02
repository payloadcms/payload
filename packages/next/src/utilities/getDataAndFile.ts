import { Collection, CustomPayloadRequest, SanitizedConfig } from 'payload/types'
import { nextFileUpload } from '../next-fileupload'

type GetDataAndFile = (args: {
  request: Request
  collection: Collection
  config: SanitizedConfig
}) => Promise<{
  data: Record<string, any>
  file: CustomPayloadRequest['file']
}>
export const getDataAndFile: GetDataAndFile = async ({ request, collection, config }) => {
  let data: Record<string, any> = undefined
  let file: CustomPayloadRequest['file'] = undefined

  if (['PATCH', 'POST', 'PUT'].includes(request.method.toUpperCase()) && request.body) {
    const [contentType] = request.headers.get('Content-Type').split(';')

    if (contentType === 'application/json') {
      data = await request.json()
    } else if (contentType === 'multipart/form-data') {
      // possible upload request
      if (collection.config.upload) {
        // load file in memory
        if (!config.upload?.useTempFiles) {
          const formData = await request.formData()
          const formFile = formData.get('file')

          if (formFile instanceof Blob) {
            const bytes = await formFile.arrayBuffer()
            const buffer = Buffer.from(bytes)

            file = {
              name: formFile.name,
              data: buffer,
              mimetype: formFile.type,
              size: formFile.size,
            }
          }

          const payloadData = formData.get('_payload')

          if (typeof payloadData === 'string') {
            data = JSON.parse(payloadData)
          }
        } else {
          // store temp file on disk
          const { fields, files, error } = await nextFileUpload({
            options: config.upload as any,
            request,
          })

          if (error) {
            throw new Error(error.message)
          }

          if (files?.file) file = files.file

          if (fields?._payload && typeof fields._payload === 'string') {
            data = JSON.parse(fields._payload)
          }
        }
      } else {
        // non upload request
        const formData = await request.formData()
        const payloadData = formData.get('_payload')

        if (typeof payloadData === 'string') {
          data = JSON.parse(payloadData)
        }
      }
    }
  }

  return {
    file,
    data,
  }
}
