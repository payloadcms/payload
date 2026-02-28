import type { Payload } from 'payload'

import path from 'path'
import { getFileByPath } from 'payload'
import { fileURLToPath } from 'url'

import { devUser } from '../credentials.js'
import {
  categoriesJoinRestrictedSlug,
  categoriesSlug,
  collectionRestrictedSlug,
  hiddenPostsSlug,
  postsSlug,
  uploadsSlug,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const seed = async (_payload: Payload) => {
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
    collection: hiddenPostsSlug,
    data: {
      category: category.id,
      title: 'Test Post 1',
    },
  })

  const post1 = await _payload.create({
    collection: postsSlug,
    data: {
      category: category.id,
      group: {
        category: category.id,
      },
      title: 'Test Post 1',
      localizedText: 'Text in en',
    },
  })

  const post2 = await _payload.create({
    collection: postsSlug,
    data: {
      category: category.id,
      group: {
        category: category.id,
      },
      title: 'Test Post 2',
      localizedText: 'Text in en',
    },
  })

  const post3 = await _payload.create({
    collection: postsSlug,
    data: {
      category: category.id,
      group: {
        category: category.id,
      },
      title: 'Test Post 3',
      localizedText: 'Text in en',
    },
  })

  await _payload.update({
    collection: postsSlug,
    id: post1.id,
    data: {
      localizedText: 'Text in es',
    },
    locale: 'es',
  })

  await _payload.update({
    collection: postsSlug,
    id: post2.id,
    data: {
      localizedText: 'Text in es',
    },
    locale: 'es',
  })

  await _payload.update({
    collection: postsSlug,
    id: post3.id,
    data: {
      localizedText: 'Text in es',
    },
    locale: 'es',
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
      upload: uploadedImage,
    },
  })

  const restrictedCategory = await _payload.create({
    collection: categoriesJoinRestrictedSlug,
    data: {
      name: 'categoryJoinRestricted',
    },
  })
  await _payload.create({
    collection: collectionRestrictedSlug,
    data: {
      title: 'should not allow read',
      canRead: false,
      category: restrictedCategory.id,
    },
  })
  await _payload.create({
    collection: collectionRestrictedSlug,
    data: {
      title: 'should allow read',
      canRead: true,
      category: restrictedCategory.id,
    },
  })

  const root_folder = await _payload.create({
    collection: 'joins-test-folders',
    data: {
      '_h_joins-test-folders': null,
      name: 'Root folder',
    },
  })

  const page_1 = await _payload.create({
    collection: 'example-pages',
    data: { title: 'page 1', name: 'Andrew', '_h_joins-test-folders': root_folder },
  })

  const post_1 = await _payload.create({
    collection: 'example-posts',
    data: { title: 'page 1', description: 'This is post 1', '_h_joins-test-folders': root_folder },
  })

  const page_2 = await _payload.create({
    collection: 'example-pages',
    data: { title: 'page 2', name: 'Sophia', '_h_joins-test-folders': root_folder },
  })

  const page_3 = await _payload.create({
    collection: 'example-pages',
    data: { title: 'page 3', name: 'Michael', '_h_joins-test-folders': root_folder },
  })

  const post_2 = await _payload.create({
    collection: 'example-posts',
    data: { title: 'post 2', description: 'This is post 2', '_h_joins-test-folders': root_folder },
  })

  const post_3 = await _payload.create({
    collection: 'example-posts',
    data: { title: 'post 3', description: 'This is post 3', '_h_joins-test-folders': root_folder },
  })

  const sub_folder_1 = await _payload.create({
    collection: 'joins-test-folders',
    data: { '_h_joins-test-folders': root_folder, name: 'Sub Folder 1' },
  })

  const page_4 = await _payload.create({
    collection: 'example-pages',
    data: { title: 'page 4', name: 'Emma', '_h_joins-test-folders': sub_folder_1 },
  })

  const post_4 = await _payload.create({
    collection: 'example-posts',
    data: { title: 'post 4', description: 'This is post 4', '_h_joins-test-folders': sub_folder_1 },
  })

  const sub_folder_2 = await _payload.create({
    collection: 'joins-test-folders',
    data: { '_h_joins-test-folders': root_folder, name: 'Sub Folder 2' },
  })

  const page_5 = await _payload.create({
    collection: 'example-pages',
    data: { title: 'page 5', name: 'Liam', '_h_joins-test-folders': sub_folder_2 },
  })

  const post_5 = await _payload.create({
    collection: 'example-posts',
    data: { title: 'post 5', description: 'This is post 5', '_h_joins-test-folders': sub_folder_2 },
  })
}
