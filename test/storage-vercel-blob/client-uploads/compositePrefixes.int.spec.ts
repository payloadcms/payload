import { del, list } from '@vercel/blob'
import { put } from '@vercel/blob/client'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../../__helpers/int/vitest.js'
import { collectionPrefix, mediaWithCompositePrefixesSlug } from '../shared.js'
import testConfig from './config.compositePrefixes.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, '../../plugin-cloud-storage/.env.emulated') })

const createdDocIDs: Array<number | string> = []

test.suite({ config: testConfig })(
  '@payloadcms/storage-vercel-blob clientUploads (composite prefixes)',
  () => {
    test.afterEach(async ({ payload }) => {
      for (const id of createdDocIDs) {
        await payload.delete({
          id,
          collection: mediaWithCompositePrefixesSlug,
        })
      }

      createdDocIDs.length = 0

      const { blobs } = await list()
      if (blobs.length > 0) {
        await del(blobs.map((b) => b.url))
      }
    })

    test('should fetch a client-uploaded file using collection and document prefixes', async ({
      restClient,
    }) => {
      const docPrefix = 'document-prefix'
      const uploadedFilename = 'client-composite-image.png'
      const pathname = `${collectionPrefix}/${docPrefix}/${uploadedFilename}`
      const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))

      const instructionsResponse = await restClient.POST('/upload-instructions', {
        body: JSON.stringify({
          collectionSlug: mediaWithCompositePrefixesSlug,
          docPrefix,
          filename: uploadedFilename,
          filesize: file.length,
          mimeType: 'image/png',
        }),
      })
      const instructions = (await instructionsResponse.json()) as {
        data: { pathname: string; token: string }
        file: {
          filename: string
          mimeType: string
          size: number
          uploadReference: { prefix: string }
        }
      }

      expect(instructions.data.pathname).toBe(pathname)

      await put(instructions.data.pathname, new Blob([file], { type: 'image/png' }), {
        access: 'public',
        contentType: 'image/png',
        token: instructions.data.token,
      })

      const formData = new FormData()

      // build formData like the admin panel does
      formData.append(
        '_payload',
        JSON.stringify({
          prefix: docPrefix,
        }),
      )
      formData.append('file', JSON.stringify(instructions.file))

      const createResponse = await restClient.POST(`/${mediaWithCompositePrefixesSlug}`, {
        body: formData,
      })

      expect(createResponse.status).toBe(201)

      const createdDoc = await createResponse.json()

      expect(createdDoc?.doc.prefix).toBe(docPrefix)

      const fileResponse = await restClient.GET(
        `/${mediaWithCompositePrefixesSlug}/file/${uploadedFilename}?prefix=${encodeURIComponent(docPrefix)}`,
      )

      expect(fileResponse.status).toBe(200)
      const fileBuffer = await fileResponse.arrayBuffer()
      expect(fileBuffer.byteLength).toBeGreaterThan(0)
    })
  },
)
