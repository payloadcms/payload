import type { Config, Payload } from 'payload'

import type { FolderInterface, Post } from '../payload-types.js'

import { devUser } from '../../credentials.js'

async function createPost(payload: Payload, { title, folder }: any): Promise<Post> {
  return payload.create({
    collection: 'posts',
    data: {
      title,
      folder,
    },
  })
}

async function createFolder(
  payload: Payload,
  { name, folder }: Pick<FolderInterface, 'folder' | 'name'>,
): Promise<FolderInterface> {
  return payload.create({
    collection: 'payload-folders',
    data: {
      name,
      folder,
    },
  })
}

export const seed: NonNullable<Config['onInit']> = async (payload) => {
  await payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
  })

  for (let i = 0; i < 12; i++) {
    await createPost(payload, {
      title: `Post ${i}`,
      folder: undefined,
    })
  }

  for (let i = 0; i < 12; i++) {
    await createFolder(payload, {
      name: `Folder ${i}`,
      folder: undefined,
    })
  }
}
