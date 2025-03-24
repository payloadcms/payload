import type { FolderInterface, Post } from 'folder-view/payload-types.js'
import type { Config, Payload } from 'payload'

import { devUser } from '../../credentials.js'

async function createPost(
  payload: Payload,
  { title, _parentFolder }: Pick<Post, '_parentFolder' | 'title'>,
): Promise<Post> {
  return payload.create({
    collection: 'posts',
    data: {
      title,
      _parentFolder,
    },
  })
}

async function createFolder(
  payload: Payload,
  {
    name,
    _parentFolder,
    isRoot = false,
  }: Pick<FolderInterface, '_parentFolder' | 'isRoot' | 'name'>,
): Promise<FolderInterface> {
  return payload.create({
    collection: '_folders',
    data: {
      name,
      _parentFolder,
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
        _parentFolder: teamFolder.id,
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
        _parentFolder: salesFolder?.id,
      }),
    ),
    ...marketers.map((title) =>
      createPost(payload, {
        title,
        _parentFolder: marketingFolder?.id,
      }),
    ),
    ...engineers.map((title) =>
      createPost(payload, {
        title,
        _parentFolder: engineersFolder?.id,
      }),
    ),
    ...designers.map((title) =>
      createPost(payload, {
        title,
        _parentFolder: designersFolder?.id,
      }),
    ),
  ])
}
