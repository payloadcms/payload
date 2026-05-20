import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { type CollectionConfig, type Config } from 'payload'

import { resetDB } from '../__helpers/shared/clearAndSeed/reset.js'
import { devUser } from '../credentials.js'
import { blocksSeedData } from './seed/blocksSeedData.js'
import {
  blocksFieldsSlug,
  collectionSlugs,
  joinFieldsSlug,
  joinPostsSlug,
  relationshipFieldsSlug,
  richTextFieldsSlug,
  tagsSlug,
  textFieldsSlug,
  uploadsSlug,
} from './slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Load file at module level, manually construct to avoid file-type dynamic import issue
const imagePath = path.resolve(dirname, '../lexical/collections/Upload/payload.jpg')
const imageData = await fs.readFile(imagePath)
const imageStat = await fs.stat(imagePath)
const imageFile = {
  name: path.basename(imagePath),
  data: imageData,
  mimetype: 'image/jpeg',
  size: imageStat.size,
}

import ArrayFields from './collections/Array/index.js'
import Autosave from './collections/Autosave/index.js'
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
import JoinFields from './collections/Join/index.js'
import JoinPosts from './collections/JoinPosts/index.js'
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
import Tags from './collections/Tags/index.js'
import TextFields from './collections/Text/index.js'
import TextareaFields from './collections/Textarea/index.js'
import Rubbish from './collections/Trash/index.js'
import Uploads from './collections/Upload/index.js'
import UploadFields from './collections/UploadField/index.js'
import {
  codeContent,
  getRichTextContent,
  getTypographyContent,
  listsContent,
  tableContent,
} from './seed/richTextData.js'

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
  JoinFields,
  JoinPosts,
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
  Tags,
  TextFields,
  TextareaFields,
  Uploads,
  UploadFields,
  DraftVersions,
  Autosave,
  Rubbish,
]

export const baseConfig: Partial<Config> = {
  collections,
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es', 'de'],
  },
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      actions: [
        './components/HeaderAction.tsx#HeaderAction',
        './components/HeaderAction.tsx#HeaderAction2',
      ],
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
    const devUserDoc = await payload.create({
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

    const createdPosts: { id: number | string }[] = []
    for (const post of posts) {
      const created = await payload.create({
        collection: textFieldsSlug,
        data: post,
      })
      createdPosts.push(created)
    }

    const richTextCount = await payload.count({ collection: richTextFieldsSlug })
    if (richTextCount.totalDocs === 0) {
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
          typography: getTypographyContent(formattedUserID),
          table: tableContent,
          code: codeContent,
        },
      })
    }

    // Seed relationship-fields to test join field
    await payload.create({
      collection: relationshipFieldsSlug,
      data: {
        authorRequired: devUserDoc.id,
        relatedPosts: createdPosts.slice(0, 3).map((p) => p.id) as string[],
      },
    })
    await payload.create({
      collection: relationshipFieldsSlug,
      data: {
        authorRequired: devUserDoc.id,
        relatedPosts: createdPosts.slice(3, 6).map((p) => p.id) as string[],
      },
    })

    // Seed blocks collection
    await payload.create({
      collection: blocksFieldsSlug,
      data: blocksSeedData,
    })

    // Seed join fields collection
    const joinCategory = await payload.create({
      collection: joinFieldsSlug,
      data: {
        name: 'Example Category',
      },
    })

    const joinPosts = [
      { title: 'First Post', _status: 'published' },
      { title: 'Second Post test', _status: 'published' },
      { title: 'Third Post', _status: 'draft' },
      { title: 'Fourth Post', _status: 'published' },
      { title: 'Fifth Post', _status: 'draft' },
    ]

    for (const post of joinPosts) {
      await payload.create({
        collection: joinPostsSlug,
        data: {
          ...post,
          category: joinCategory.id,
        },
      })
    }

    // Seed tags hierarchy for testing hierarchy field
    const techTag = await payload.create({
      collection: tagsSlug,
      data: { name: 'Technology' },
    })

    const frontendTag = await payload.create({
      collection: tagsSlug,
      data: { name: 'Frontend', parent: techTag.id },
    })

    await payload.create({
      collection: tagsSlug,
      data: { name: 'React', parent: frontendTag.id },
    })

    await payload.create({
      collection: tagsSlug,
      data: { name: 'Vue', parent: frontendTag.id },
    })

    const backendTag = await payload.create({
      collection: tagsSlug,
      data: { name: 'Backend', parent: techTag.id },
    })

    await payload.create({
      collection: tagsSlug,
      data: { name: 'Node.js', parent: backendTag.id },
    })

    await payload.create({
      collection: tagsSlug,
      data: { name: 'Python', parent: backendTag.id },
    })

    await payload.create({
      collection: tagsSlug,
      data: { name: 'Design' },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
}
