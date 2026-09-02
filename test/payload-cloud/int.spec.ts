import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { createStreamableFile } from '../uploads/createStreamableFile.js'

const stat = promisify(fs.stat)

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.suite({ config: './config.ts' })('@payloadcms/payload--cloud', () => {
  test.describe('tests', () => {
    test.todo('payload-cloud tests')

    test('should not throw file MIME type error when useTempFiles is true', async ({
      restClient,
    }) => {
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

    test.for([
      { fileType: 'text', fileName: 'test-document.txt' },
      { fileType: 'PDF', fileName: 'test-pdf.pdf' },
      { fileType: 'audio', fileName: 'audio.mp3' },
    ])(
      'should save $fileType files with correct file size when useTempFiles is true',
      async ({ fileName }, { payload, restClient }) => {
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
