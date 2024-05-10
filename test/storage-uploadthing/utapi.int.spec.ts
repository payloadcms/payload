import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { getFileByPath } from 'payload/uploads'
import { UTApi, UTFile } from 'uploadthing/server'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Load config to work with emulated services
dotenv.config({
  path: path.resolve(dirname, './.env'),
})

const utApi = new UTApi({ apiKey: process.env.UPLOADTHING_SECRET })

describe('utapi', () => {
  it('can upload', async () => {
    const imageFilePath = path.resolve(dirname, '../uploads/image.png')
    const imageFile = await getFileByPath(imageFilePath)

    const blob = new Blob([imageFile.data], { type: imageFile.mimetype })
    // const blob = new File(['foo'], 'foo.txt', { type: 'text/plain' })
    // const blob = new UTFile([imageFile.data], imageFile.name)

    try {
      // const res = await utApi.uploadFiles(fileEsque, { acl: 'public-read' })
      // const res = await utApi.uploadFiles(new UTFile(['foo'], 'foo.txt'), { acl: 'public-read' })
      const res = await utApi.uploadFiles(new UTFile([blob], imageFile.name), {
        acl: 'public-read',
      })

      expect(res).toBeTruthy()
    } catch (error) {
      console.log('nope')
    }
  })
})
