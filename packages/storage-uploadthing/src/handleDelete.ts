import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types'
import type { UTApi } from 'uploadthing/server'

import { APIError } from 'payload'

import { getKeyFromFilename } from './utilities.js'

type Args = {
  utApi: UTApi
}

export const getHandleDelete = ({ utApi }: Args): HandleDelete => {
  return async ({ doc, filename, req }) => {
    const key = getKeyFromFilename(doc, filename)

    if (!key) {
      req.payload.logger.error({
        msg: `Error deleting file: ${filename} - unable to extract key from doc`,
      })
      throw new APIError(`Error deleting file: ${filename}`)
    }

    try {
      if (key) {
        await utApi.deleteFiles(key)
      }
    } catch (err) {
      req.payload.logger.error({
        err,
        msg: `Error deleting file with key: ${filename} - key: ${key}`,
      })
      throw new APIError(`Error deleting file: ${filename}`)
    }
  }
}
