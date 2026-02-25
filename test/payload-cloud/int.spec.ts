import fs from 'fs'
import path from 'path'
import { type Payload } from 'payload'
import { fileURLToPath } from 'url'
import { promisify } from 'util'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { createStreamableFile } from '../uploads/createStreamableFile.js'

const stat = promisify(fs.stat)

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

    it.each([
      { fileType: 'text', fileName: 'test-document.txt' },
      { fileType: 'PDF', fileName: 'test-pdf.pdf' },
      { fileType: 'audio', fileName: 'audio.mp3' },
    ])(
      'should save $fileType files with correct file size when useTempFiles is true',
      async ({ fileName }) => {
        const formData = new FormData()
        const filePath = path.join(dirname, `./${fileName}`)
        const originalStats = await stat(filePath)
        const { file, handle } = await createStreamableFile(filePath)
        formData.append('file', file)

        const response = await restClient.POST(`/documents`, {
          body: formData,
          file,
        })

        const { doc } = await response.json()

        await handle.close()

        expect(response.status).toBe(201)
        expect(doc.filename).toBeDefined()

        // Verify the file was saved with the correct size
        const savedFilePath = path.join(dirname, './documents', doc.filename)
        const savedStats = await stat(savedFilePath)

        // The saved file should have the same size as the original file
        expect(savedStats.size).toBe(originalStats.size)
        expect(savedStats.size).toBeGreaterThan(0)
        expect(doc.filesize).toBe(originalStats.size)

        await payload.delete({
          collection: 'documents',
          id: doc.id,
        })
      },
    )
  })
})
