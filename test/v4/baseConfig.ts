import type { CollectionConfig, Config } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'
import { getFileByPath } from 'payload'

import { resetDB } from '../__helpers/shared/clearAndSeed/reset.js'
import { devUser } from '../credentials.js'
import { blocksSeedData } from './seed/blocksSeedData.js'
import {
  codeContent,
  getRichTextContent,
  listsContent,
  tableContent,
  typographyContent,
} from './seed/richTextData.js'
import {
  blocksFieldsSlug,
  collectionSlugs,
  richTextFieldsSlug,
  textFieldsSlug,
  uploadsSlug,
} from './slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import ArrayFields from './collections/Array/index.js'
import BlocksFields from './collections/Blocks/index.js'
import CheckboxFields from './collections/Checkbox/index.js'
import CodeFields from './collections/Code/index.js'
import CollapsibleFields from './collections/Collapsible/index.js'
import DateFields from './collections/Date/index.js'
import DraftVersions from './collections/DraftVersions/index.js'
import EmailFields from './collections/Email/index.js'
import FolderItems from './collections/FolderItems/index.js'
import { Folders } from './collections/Folders/index.js'
import GroupFields from './collections/Group/index.js'
import JSONFields from './collections/JSON/index.js'
import NumberFields from './collections/Number/index.js'
import PasswordFields from './collections/Password/index.js'
import PointFields from './collections/Point/index.js'
import RadioFields from './collections/Radio/index.js'
import RelationshipFields from './collections/Relationship/index.js'
import RichTextFields from './collections/RichText/index.js'
import RowFields from './collections/Row/index.js'
import SelectFields from './collections/Select/index.js'
import SlugFields from './collections/Slug/index.js'
import TabsFields from './collections/Tabs/index.js'
import TextFields from './collections/Text/index.js'
import TextareaFields from './collections/Textarea/index.js'
import Uploads from './collections/Upload/index.js'
import UploadFields from './collections/UploadField/index.js'

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
  FolderItems,
  Folders,
  GroupFields,
  JSONFields,
  NumberFields,
  PasswordFields,
  PointFields,
  RadioFields,
  RelationshipFields,
  RichTextFields,
  RowFields,
  SelectFields,
  SlugFields,
  TabsFields,
  TextFields,
  TextareaFields,
  Uploads,
  UploadFields,
  DraftVersions,
]

export const baseConfig: Partial<Config> = {
  collections,
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      afterNavLinks: ['./views/Components/NavLink.js#ComponentsNavLink'],
      views: {
        components: {
          Component: './views/Components/index.js#ComponentsView',
          path: '/components',
        },
      },
    },
  },
  onInit: async (payload) => {
    // Clear existing data before seeding
    await resetDB(payload, collectionSlugs)

    // Seed users
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

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

    // Seed text-fields collection for relationship testing
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

    const richTextCount = await payload.count({ collection: richTextFieldsSlug })
    if (richTextCount.totalDocs === 0) {
      const imagePath = path.resolve(dirname, '../lexical/collections/Upload/payload.jpg')
      const imageFile = await getFileByPath(imagePath)

      const uploadDoc = await payload.create({
        collection: uploadsSlug,
        data: { alt: 'Farming image' },
        file: imageFile,
      })

      const formattedUploadID =
        payload.db.defaultIDType === 'number' ? uploadDoc.id : `"${uploadDoc.id}"`

      const devUserDoc = await payload.find({
        collection: 'users',
        where: { email: { equals: devUser.email } },
        limit: 1,
      })
      const userId = devUserDoc.docs[0]?.id
      const formattedUserID =
        userId !== undefined
          ? payload.db.defaultIDType === 'number'
            ? userId
            : `"${userId}"`
          : undefined

      const richTextContent = getRichTextContent(formattedUploadID, formattedUserID)

      await payload.create({
        collection: richTextFieldsSlug,
        data: {
          title: 'Data harvest \u2013 how AI and sensors are revolutionizing farming',
          content: richTextContent,
          lists: listsContent,
          typography: typographyContent,
          table: tableContent,
          code: codeContent,
        },
      })
    }
    // Seed blocks collection
    await payload.create({
      collection: blocksFieldsSlug,
      data: blocksSeedData,
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
}
