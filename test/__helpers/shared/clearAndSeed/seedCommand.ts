import { defineCLICommand, strictObject } from 'payload/cli'

import type { TestDataConfig } from './testDataConfig.js'

import { resetAndSeed } from './resetAndSeed.js'

export const createSeedCommand = ({ seed, suite }: TestDataConfig) =>
  defineCLICommand({
    description: `${seed ? 'Reset and seed' : 'Reset'} the ${suite} test suite database.`,
    handler: async ({ getPayload }) => {
      const payload = await getPayload()

      await resetAndSeed({
        alwaysSeed: true,
        payload,
        seed,
        suite,
      })

      payload.logger.info(
        `${seed ? 'Reset and seeded' : 'Reset'} the ${suite} test suite database.`,
      )
    },
    input: strictObject({}),
  })
