import { beforeAll } from 'vitest'

import { registerBuildingPluginsSuite } from './suites/index.js'

beforeAll(() => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY must be set to run eval tests')
  }
})

registerBuildingPluginsSuite({ labelSuffix: ' (baseline)', systemPromptKey: 'qaNoSkill' })
