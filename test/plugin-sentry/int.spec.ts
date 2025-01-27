import { initPayloadTest } from '../helpers/configHelpers'

describe('plugin-sentry', () => {
  beforeAll(async () => {
    await initPayloadTest({ __dirname, init: { local: true } })
  })

  describe('tests', () => {
    it.todo('plugin-sentry tests')
  })
})
