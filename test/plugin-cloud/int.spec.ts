import { initPayloadTest } from '../helpers/configHelpers'

describe('Nested Docs', () => {
  beforeAll(async () => {
    await initPayloadTest({ __dirname, init: { local: true } })
  })

  describe('tests', () => {
    it.todo('plugin-cloud tests')
  })
})
