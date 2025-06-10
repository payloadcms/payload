import type { Endpoint, PayloadHandler } from 'payload'

import { status as httpStatus } from 'http-status'
import * as qs from 'qs-esm'

import { path } from './reInitializeDB.js'
import { seedDB } from './seed.js'

const handler: PayloadHandler = async (req) => {
  process.env.SEED_IN_CONFIG_ONINIT = 'true'
  const { payload } = req

  if (!req.url) {
    throw new Error('Request URL is required')
  }

  const query: {
    deleteOnly?: boolean
    snapshotKey?: string
    uploadsDir?: string | string[]
  } = qs.parse(req.url.split('?')[1] ?? '', {
    depth: 10,
    ignoreQueryPrefix: true,
  })

  try {
    console.log('Calling seedDB')
    await seedDB({
      _payload: payload,
      collectionSlugs: payload.config.collections.map(({ slug }) => slug),
      seedFunction: payload.config.onInit,
      snapshotKey: String(query.snapshotKey),
      // uploadsDir can be string or stringlist
      uploadsDir: query.uploadsDir as string | string[],
      deleteOnly: query.deleteOnly,
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
  method: 'get',
  handler,
}
