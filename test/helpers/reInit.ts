import type { Endpoint, PayloadHandler } from 'payload'

import { status as httpStatus } from 'http-status'
import { addDataAndFileToRequest } from 'payload'

import { path } from './reInitializeDB.js'
import { seedDB } from './seed.js'

const handler: PayloadHandler = async (req) => {
  process.env.SEED_IN_CONFIG_ONINIT = 'true'
  await addDataAndFileToRequest(req)
  const { data, payload } = req

  try {
    await seedDB({
      _payload: payload,
      collectionSlugs: payload.config.collections.map(({ slug }) => slug),
      seedFunction: payload.config.onInit,
      snapshotKey: String(data.snapshotKey),
      // uploadsDir can be string or stringlist
      uploadsDir: data.uploadsDir as string | string[],
      deleteOnly: data.deleteOnly,
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
