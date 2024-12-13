import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { Page } from './payload-types.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { pagesSlug } from './shared.js'

let payload: Payload
let page: Page

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('@payloadcms/plugin-import-export', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))

    page = await payload.create({
      collection: 'pages',
      data: {
        title: 'Test',
      },
    })
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  it.todo('works')
})
