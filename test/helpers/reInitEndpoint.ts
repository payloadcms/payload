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
    deleteOnly?: string
    uploadsDir?: string | string[]
  } = qs.parse(req.url.split('?')[1] ?? '', {
    depth: 10,
    ignoreQueryPrefix: true,
  })

  let uploadsDir = query.uploadsDir as string | string[]
  if (typeof uploadsDir === 'object') {
    uploadsDir = Object.values(uploadsDir)
  }

  try {
    await seedDB({
      _payload: payload,
      collectionSlugs: payload.config.collections.map(({ slug }) => slug),
      seedFunction: payload.config.onInit,
      // uploadsDir can be string or stringlist
      uploadsDir,
      // query value will be a string of 'true' or 'false'
      deleteOnly: query.deleteOnly === 'true',
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
