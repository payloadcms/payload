import type { Payload } from 'payload'

import { compress, exportData } from '@payloadcms/plugin-import-export'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { initPayloadInt } from '../helpers/initPayloadInt.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const exportDir = path.join(dirname, 'data')

describe('@payloadcms/plugin-import-export', () => {
  beforeAll(async () => {
    const initialized = await initPayloadInt(dirname)
    ;({ payload } = initialized)
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }

    if (fs.existsSync(exportDir)) {
      fs.rmdirSync(exportDir, { recursive: true })
    }
  })

  it('export and compress data', async () => {
    await exportData({ payload })

    const exported = await payload.find({
      collection: 'payload-exports',
    })

    expect(exported.docs).toHaveLength(1)

    const { zipPath } = await compress({
      payload,
      destination: path.join(exportDir, 'export-test'),
    })

    // TODO: Validate file structure

    expect(fs.existsSync(zipPath)).toBe(true)
  })
})
