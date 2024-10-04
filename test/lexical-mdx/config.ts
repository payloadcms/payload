import { lexicalEditor } from '@payloadcms/richtext-lexical'
import * as fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { MediaCollection } from './collections/Media/index.js'
import { PostsCollection } from './collections/Posts/index.js'
import { docsBasePath } from './collections/Posts/shared.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  // ...extend config here
  collections: [
    PostsCollection,
    {
      slug: 'simple',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
    MediaCollection,
  ],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  editor: lexicalEditor({}),
  cors: ['http://localhost:3000', 'http://localhost:3001'],
  globals: [],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    await payload.delete({
      collection: 'posts',
      where: {},
    })

    // Recursively collect all paths to .mdx files RELATIVE to basePath
    const walkSync = (dir: string, filelist: string[] = []) => {
      fs.readdirSync(dir).forEach((file) => {
        filelist = fs.statSync(path.join(dir, file)).isDirectory()
          ? walkSync(path.join(dir, file), filelist)
          : filelist.concat(path.join(dir, file))
      })
      return filelist
    }

    const mdxFiles = walkSync(docsBasePath)
      .filter((file) => file.endsWith('.mdx'))
      .map((file) => file.replace(docsBasePath, ''))

    for (const file of mdxFiles) {
      await payload.create({
        collection: 'posts',
        depth: 0,
        context: {
          seed: true,
        },
        data: {
          docPath: file,
        },
      })
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
