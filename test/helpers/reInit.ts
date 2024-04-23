import type { Endpoint } from 'payload/config'
import type { PayloadRequest } from 'payload/types'

import { addDataAndFileToRequest, addLocalesToRequest } from '@payloadcms/next/utilities'
import httpStatus from 'http-status'

import { path } from './reInitializeDB.js'
import { seedDB } from './seed.js'

const handler = async (req: PayloadRequest) => {
  process.env.SEED_IN_CONFIG_ONINIT = 'true'
  await addDataAndFileToRequest({ request: req })
  addLocalesToRequest({ request: req })
  const { data, payload } = req

  try {
    await seedDB({
      _payload: payload,
      collectionSlugs: payload.config.collections.map(({ slug }) => slug),
      seedFunction: payload.config.onInit,
      snapshotKey: String(data.snapshotKey),
      uploadsDir: String(data.uploadsDir),
    })

    return Response.json(
      {
        message: 'Database reset and onInit run successfully.',
      },
      {
        status: httpStatus.OK,
      },
    )
  } catch (err) {
    payload.logger.error(err)
    return Response.json(err, {
      status: httpStatus.BAD_REQUEST,
    })
  }
}

export const reInitEndpoint: Endpoint = {
  path,
  method: 'post',
  handler,
}
