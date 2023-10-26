import { initPayloadTest } from '../helpers/configHelpers'

describe('plugin-cloud-storage', () => {
  beforeAll(async () => {
    await initPayloadTest({ __dirname, init: { local: true } })
  })

  describe('tests', () => {
    it.todo('plugin-cloud-storage tests')
  })
})
