import { beforeAll } from 'vitest'

import { MODELS } from './models.js'
import { registerNegativeSuite } from './suites/index.js'

const LOW_POWER_MODEL = MODELS['openai:gpt-4o']

beforeAll(() => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY must be set to run eval tests')
  }
})

registerNegativeSuite({ runnerModel: LOW_POWER_MODEL, labelSuffix: ' (low-power)' })
