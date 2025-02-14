import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Media } from './collections/Media/index.js'
import { Posts } from './collections/Posts/index.js'

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Posts, Media],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
    await payload.create({
      collection: '_folders',
      data: {
        name: 'Root',
        isRoot: true,
      },
    })
    const memesFolder = await payload.create({
      collection: '_folders',
      data: {
        name: 'Memes',
      },
    })
    const nateMemesFolder = await payload.create({
      collection: '_folders',
      data: {
        name: 'Nate Memes',
        _parentFolder: memesFolder.id,
      },
    })
    await payload.create({
      collection: '_folders',
      data: {
        name: 'Sacred Nate Memes',
        _parentFolder: nateMemesFolder.id,
      },
    })
    await payload.create({
      collection: 'posts',
      data: {
        title: 'Nate Shambles',
        _parentFolder: nateMemesFolder.id,
      },
    })
    await payload.create({
      collection: 'posts',
      data: {
        title: 'The Den',
        _parentFolder: nateMemesFolder.id,
      },
    })
    await payload.create({
      collection: 'posts',
      data: {
        title: 'Marekteer',
        _parentFolder: nateMemesFolder.id,
      },
    })
    await payload.create({
      collection: 'posts',
      data: {
        title: 'Nate+James',
        _parentFolder: nateMemesFolder.id,
      },
    })
    await payload.create({
      collection: '_folders',
      data: {
        name: 'Social',
      },
    })
    await payload.create({
      collection: '_folders',
      data: {
        name: 'Slack Emojis',
      },
    })
    await payload.create({
      collection: '_folders',
      data: {
        name: 'This is a really long folder name',
      },
    })
    await payload.create({
      collection: 'posts',
      data: {
        title: 'Post 1',
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
