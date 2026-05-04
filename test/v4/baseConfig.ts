import type { CollectionConfig, Config } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'

import { devUser } from '../credentials.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import ArrayFields from './collections/Array/index.js'
import BlocksFields from './collections/Blocks/index.js'
import CheckboxFields from './collections/Checkbox/index.js'
import CodeFields from './collections/Code/index.js'
import CollapsibleFields from './collections/Collapsible/index.js'
import DateFields from './collections/Date/index.js'
import EmailFields from './collections/Email/index.js'
import GroupFields from './collections/Group/index.js'
import JSONFields from './collections/JSON/index.js'
import NumberFields from './collections/Number/index.js'
import PasswordFields from './collections/Password/index.js'
import PointFields from './collections/Point/index.js'
import RadioFields from './collections/Radio/index.js'
import RelationshipFields from './collections/Relationship/index.js'
import RowFields from './collections/Row/index.js'
import SelectFields from './collections/Select/index.js'
import SlugFields from './collections/Slug/index.js'
import TabsFields from './collections/Tabs/index.js'
import TextFields from './collections/Text/index.js'
import TextareaFields from './collections/Textarea/index.js'
import Uploads from './collections/Upload/index.js'
import UploadFields from './collections/UploadField/index.js'
import { textFieldsSlug } from './slugs.js'

export const collections: CollectionConfig[] = [
  {
    slug: 'users',
    admin: {
      useAsTitle: 'email',
    },
    auth: true,
    fields: [],
  },
  ArrayFields,
  BlocksFields,
  CheckboxFields,
  CodeFields,
  CollapsibleFields,
  DateFields,
  EmailFields,
  GroupFields,
  JSONFields,
  NumberFields,
  PasswordFields,
  PointFields,
  RadioFields,
  RelationshipFields,
  RowFields,
  SelectFields,
  SlugFields,
  TabsFields,
  TextFields,
  TextareaFields,
  Uploads,
  UploadFields,
]

export const baseConfig: Partial<Config> = {
  collections,
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  onInit: async (payload) => {
    const usersCount = await payload.count({ collection: 'users' })
    if (usersCount.totalDocs === 0) {
      await payload.create({
        collection: 'users',
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })

      // Seed additional users for relationship field testing
      const authors = [
        { email: 'alice@example.com', password: 'password123' },
        { email: 'bob@example.com', password: 'password123' },
        { email: 'charlie@example.com', password: 'password123' },
      ]

      for (const author of authors) {
        await payload.create({
          collection: 'users',
          data: author,
        })
      }
    }

    // Seed text-fields collection for relationship testing
    const textFieldsCount = await payload.count({ collection: textFieldsSlug })
    if (textFieldsCount.totalDocs === 0) {
      const posts = [
        { title: 'Getting Started with Payload' },
        { title: 'Advanced Relationship Fields' },
        { title: 'Building a Blog with Payload' },
        { title: 'Understanding Collections' },
        { title: 'Working with Uploads' },
        { title: 'Custom Components Guide' },
        { title: 'Authentication Deep Dive' },
        { title: 'GraphQL vs REST API' },
      ]

      for (const post of posts) {
        await payload.create({
          collection: textFieldsSlug,
          data: post,
        })
      }
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
}
