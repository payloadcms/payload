import type { FolderInterface, Post } from 'folder-view/payload-types.js'
import type { Config, Payload } from 'payload'

import { devUser } from '../../credentials.js'

async function createPost(
  payload: Payload,
  { title, _folder }: Pick<Post, '_folder' | 'title'>,
): Promise<Post> {
  return payload.create({
    collection: 'posts',
    data: {
      title,
      _folder,
    },
  })
}

async function createFolder(
  payload: Payload,
  { name, _folder, isRoot = false }: Pick<FolderInterface, '_folder' | 'isRoot' | 'name'>,
): Promise<FolderInterface> {
  return payload.create({
    collection: '_folders',
    data: {
      name,
      _folder,
      isRoot,
    },
  })
}

export const seed: Config['onInit'] = async (payload) => {
  await payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
  })
  await createFolder(payload, {
    name: 'Root',
    isRoot: true,
  })
  const teamFolder = await createFolder(payload, {
    name: 'Team',
  })
  const [designersFolder, engineersFolder, marketingFolder, salesFolder] = await Promise.all(
    ['Designers', 'Engineers', 'Marketing', 'Sales'].map((name) =>
      createFolder(payload, {
        name,
        _folder: teamFolder.id,
      }),
    ),
  )

  const marketers = ['Nate']
  const designers = ['Sarah', 'Tylan']
  const sales = ['Sean', 'Garrentt', 'Evan']
  const engineers = [
    'Jarrod',
    'James',
    'Jacob',
    'Alessio',
    'Patrik',
    'Paul',
    'Dan',
    'Elliot',
    'Sasha',
    'Kendell',
    'Jessica',
    'Germán',
  ]

  await Promise.all([
    ...sales.map((title) =>
      createPost(payload, {
        title,
        _folder: salesFolder?.id,
      }),
    ),
    ...marketers.map((title) =>
      createPost(payload, {
        title,
        _folder: marketingFolder?.id,
      }),
    ),
    ...engineers.map((title) =>
      createPost(payload, {
        title,
        _folder: engineersFolder?.id,
      }),
    ),
    ...designers.map((title) =>
      createPost(payload, {
        title,
        _folder: designersFolder?.id,
      }),
    ),
  ])
}
