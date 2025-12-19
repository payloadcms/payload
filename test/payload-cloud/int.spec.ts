import path from 'path'
import { type Payload } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { createStreamableFile } from '../uploads/createStreamableFile.js'

let restClient: NextRESTClient
let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('@payloadcms/payload--cloud', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  describe('tests', () => {
    it.todo('payload-cloud tests')

    it('should not throw file MIME type error when useTempFiles is true', async () => {
      const formData = new FormData()
      const filePath = path.join(dirname, './image.png')
      const { file, handle } = await createStreamableFile(filePath)
      formData.append('file', file)

      const response = await restClient.POST(`/media`, {
        body: formData,
        file,
      })

      await handle.close()

      expect(response.status).toBe(201)
    })
  })
})
