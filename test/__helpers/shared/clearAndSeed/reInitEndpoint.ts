import type { Endpoint, PayloadHandler } from 'payload'

import { status as httpStatus } from 'http-status'
import * as qs from 'qs-esm'

import type { TestDataConfig } from './testDataConfig.js'

import { path } from './reInitializeDB.js'
import { resetAndSeed } from './resetAndSeed.js'
import { seedDB } from './seed.js'

export const createReInitEndpoint = ({ seed, suite }: TestDataConfig): Endpoint => {
  let resetQueue = Promise.resolve()

  const handler: PayloadHandler = async (req) => {
    const { payload } = req

    if (!req.url) {
      throw new Error('Request URL is required')
    }

    const query: {
      deleteOnly?: string
    } = qs.parse(req.url.split('?')[1] ?? '', {
      depth: 10,
      ignoreQueryPrefix: true,
    })

    const reset = resetQueue.then(async () => {
      await resetAndSeed({
        deleteOnly: query.deleteOnly === 'true',
        payload,
        seed,
        suite,
      })
    })
    resetQueue = reset.catch(() => undefined)

    try {
      await reset

      return Response.json(
        {
          message: 'Database reset and seed run successfully.',
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

  return {
    handler,
    method: 'post',
    path,
  }
}

const legacyHandler: PayloadHandler = async (req) => {
  process.env.SEED_IN_CONFIG_ONINIT = 'true'
  const { payload } = req

  if (!req.url) {
    throw new Error('Request URL is required')
  }

  const query: {
    deleteOnly?: string
    snapshotKey?: string
    uploadsDir?: string | string[]
  } = qs.parse(req.url.split('?')[1] ?? '', {
    depth: 10,
    ignoreQueryPrefix: true,
  })

  let uploadsDir = query.uploadsDir
  if (typeof uploadsDir === 'object') {
    uploadsDir = Object.values(uploadsDir)
  }

  try {
    await seedDB({
      _payload: payload,
      collectionSlugs: payload.config.collections.map(({ slug }) => slug),
      deleteOnly: query.deleteOnly === 'true',
      seedFunction: payload.config.onInit,
      snapshotKey: String(query.snapshotKey),
      uploadsDir,
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

/** @deprecated Migrate the config to `buildConfigWithDefaults({ config, seed, suite })`. */
export const reInitEndpoint: Endpoint = {
  handler: legacyHandler,
  method: 'get',
  path,
}
