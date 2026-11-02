import type { Config, Payload } from 'payload'

import type { Post } from '../payload-types.js'

import { devUser } from '../../credentials.js'
import { folderSlug } from '../shared.js'

async function createPost(
  payload: Payload,
  { title, folder }: { folder?: string; title: string },
): Promise<Post> {
  return payload.create({
    collection: 'posts',
    data: {
      title,
      folder,
    },
    overrideAccess: true,
  })
}

async function createFolder(
  payload: Payload,
  { name, folder }: { folder?: string; name: string },
): Promise<{ folder?: string; id: string; name: string }> {
  return payload.create({
    collection: folderSlug,
    data: {
      name,
      folder,
    },
    overrideAccess: true,
  })
}

export const seed: NonNullable<Config['onInit']> = async (payload) => {
  await payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
    overrideAccess: true,
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
