import type { UTApiOptions } from 'uploadthing/types'

import { uploadthingStorage } from '@payloadcms/storage-uploadthing'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { getFileByPath } from 'payload/uploads'
import { UTApi, UTFile } from 'uploadthing/server'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Media } from './collections/Media.js'
import { MediaWithPrefix } from './collections/MediaWithPrefix.js'
import { Users } from './collections/Users.js'
import { mediaSlug, mediaWithPrefixSlug, prefix } from './shared.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Load config to work with emulated services
dotenv.config({
  path: path.resolve(dirname, './.env.uploadthing'),
})

const utApi = new UTApi({ apiKey: process.env.UPLOADTHING_SECRET })

describe('utapi', () => {
  it('can upload', async () => {
    const imageFilePath = path.resolve(dirname, '../uploads/image.png')
    const imageFile = await getFileByPath(imageFilePath)

    // const blob = new Blob([imageFile.data], { type: imageFile.mimetype })
    // const blob = new File(['foo'], 'foo.txt', { type: 'text/plain' })
    const blob = new UTFile([imageFile.data], imageFile.name)

    const fileEsque = {
      name: imageFile.name,
      ...blob,
    }

    try {
      const res = await utApi.uploadFiles(fileEsque, { acl: 'public-read' })

      expect(res).toBeTruthy()
    } catch (error) {
      console.log('nope')
    }
  })
})
