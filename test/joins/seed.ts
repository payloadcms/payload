import type { Payload } from 'payload'

import path from 'path'
import { getFileByPath } from 'payload'
import { fileURLToPath } from 'url'

import { devUser } from '../credentials.js'
import { seedDB } from '../helpers/seed.js'
import { categoriesSlug, collectionSlugs, postsSlug, uploadsSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const seed = async (_payload) => {
  await _payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
  })

  const category = await _payload.create({
    collection: categoriesSlug,
    data: {
      name: 'example',
      group: {},
    },
  })

  await _payload.create({
    collection: postsSlug,
    data: {
      category: category.id,
      group: {
        category: category.id,
      },
      title: 'Test Post 1',
    },
  })

  await _payload.create({
    collection: postsSlug,
    data: {
      category: category.id,
      group: {
        category: category.id,
      },
      title: 'Test Post 2',
    },
  })

  await _payload.create({
    collection: postsSlug,
    data: {
      category: category.id,
      group: {
        category: category.id,
      },
      title: 'Test Post 3',
    },
  })

  // create an upload with image.png
  const imageFilePath = path.resolve(dirname, './image.png')
  const imageFile = await getFileByPath(imageFilePath)
  const { id: uploadedImage } = await _payload.create({
    collection: uploadsSlug,
    data: {},
    file: imageFile,
  })

  // create a post that uses the upload
  await _payload.create({
    collection: postsSlug,
    data: {
      upload: uploadedImage.id,
    },
  })
}

export async function clearAndSeedEverything(_payload: Payload) {
  return await seedDB({
    _payload,
    collectionSlugs,
    seedFunction: seed,
    snapshotKey: 'adminTest',
  })
}
