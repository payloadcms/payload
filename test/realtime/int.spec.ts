import type { Server } from 'http'

import { createServer } from 'http'
import path from 'path'
import { bindWebsocketToServer, type Payload } from 'payload'
import { fileURLToPath } from 'url'

import { initPayloadInt } from '../helpers/initPayloadInt.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let server: Server
describe('_Community Tests', () => {
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  beforeAll(async () => {
    const initialized = await initPayloadInt(dirname)
    ;({ payload } = initialized)

    server = createServer().listen(3010)

    await bindWebsocketToServer({ server, config: payload.config })
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }

    server.close()
  })

  it('should work', () => {
    expect(true).toBeTruthy()
  })
  // --__--__--__--__--__--__--__--__--__
  // You can run tests against the local API or the REST API
  // use the tests below as a guide
  // --__--__--__--__--__--__--__--__--__
})
