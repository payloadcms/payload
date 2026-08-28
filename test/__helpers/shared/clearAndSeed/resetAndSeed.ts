import type { Payload } from 'payload'

import type { TestDataConfig } from './testDataConfig.js'

import { getUploadDirectories } from './getUploadDirectories.js'
import { seedDB } from './seed.js'

export const resetAndSeed = async ({
  alwaysSeed,
  deleteOnly,
  payload,
  seed,
  suite,
}: {
  alwaysSeed?: boolean
  deleteOnly?: boolean
  payload: Payload
} & TestDataConfig): Promise<void> => {
  await seedDB({
    _payload: payload,
    alwaysSeed,
    collectionSlugs: payload.config.collections.map(({ slug }) => slug),
    deleteOnly,
    seedFunction: seed,
    snapshotKey: suite,
    uploadsDir: getUploadDirectories({ payload }),
  })
}
