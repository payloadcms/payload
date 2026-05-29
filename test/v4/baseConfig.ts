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
  docControlsSlug,
  draftVersionsSlug,
  folderItemsSlug,
  foldersSlug,
  joinFieldsSlug,
  joinPostsSlug,
  orderableSlug,
  relationshipFieldsSlug,
  richTextFieldsSlug,
  tagItemsSlug,
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
import DocControls from './collections/DocControls/index.js'
import DraftVersions from './collections/DraftVersions/index.js'
import EmailFields from './collections/Email/index.js'
import FolderItems from './collections/FolderItems/index.js'
import { Folders } from './collections/Folders/index.js'
import GroupFields from './collections/Group/index.js'
import JoinFields from './collections/Join/index.js'
import JoinPosts from './collections/JoinPosts/index.js'
import JSONFields from './collections/JSON/index.js'
import NumberFields from './collections/Number/index.js'
import Orderable from './collections/Orderable/index.js'
import PasswordFields from './collections/Password/index.js'
import PointFields from './collections/Point/index.js'
import RadioFields from './collections/Radio/index.js'
import RelationshipFields from './collections/Relationship/index.js'
import RichTextFields from './collections/RichText/index.js'
import RowFields from './collections/Row/index.js'
import SearchBarTest from './collections/SearchBarTest/index.js'
import SelectFields from './collections/Select/index.js'
import SlugFields from './collections/Slug/index.js'
import TabsFields from './collections/Tabs/index.js'
import TagItems from './collections/TagItems/index.js'
import Tags from './collections/Tags/index.js'
import TextFields from './collections/Text/index.js'
import TextareaFields from './collections/Textarea/index.js'
import Rubbish from './collections/Trash/index.js'
import Unauthorized from './collections/Unauthorized/index.js'
import Uploads from './collections/Upload/index.js'
import UploadFields from './collections/UploadField/index.js'
import {
  codeContent,
  getRichTextContent,
  getTypographyContent,
  listsContent,
  tableContent,
} from './seed/richTextData.js'

const withGroup = (collection: CollectionConfig, group: string): CollectionConfig => ({
  ...collection,
  admin: {
    ...collection.admin,
    group,
  },
})

export const collections: CollectionConfig[] = [
  // Elements
  withGroup(DocControls, 'Elements'),
  withGroup(Orderable, 'Elements'),
  withGroup(SearchBarTest, 'Elements'),
  withGroup(Unauthorized, 'Elements'),
  // Fields
  withGroup(ArrayFields, 'Fields'),
  withGroup(BlocksFields, 'Fields'),
  withGroup(CheckboxFields, 'Fields'),
  withGroup(CodeFields, 'Fields'),
  withGroup(CollapsibleFields, 'Fields'),
  withGroup(DateFields, 'Fields'),
  withGroup(EmailFields, 'Fields'),
  withGroup(GroupFields, 'Fields'),
  withGroup(JoinFields, 'Fields'),
  withGroup(JoinPosts, 'Fields'),
  withGroup(JSONFields, 'Fields'),
  withGroup(NumberFields, 'Fields'),
  withGroup(PasswordFields, 'Fields'),
  withGroup(PointFields, 'Fields'),
  withGroup(RadioFields, 'Fields'),
  withGroup(RelationshipFields, 'Fields'),
  withGroup(RichTextFields, 'Fields'),
  withGroup(RowFields, 'Fields'),
  withGroup(SelectFields, 'Fields'),
  withGroup(SlugFields, 'Fields'),
  withGroup(TabsFields, 'Fields'),
  withGroup(TextFields, 'Fields'),
  withGroup(TextareaFields, 'Fields'),
  // Uploads
  Uploads,
  UploadFields,
  // Versions
  Autosave,
  DraftVersions,
  // Views
  withGroup(Folders, 'Views'),
  withGroup(FolderItems, 'Views'),
  withGroup(Rubbish, 'Views'),
  withGroup(Tags, 'Views'),
  withGroup(TagItems, 'Views'),
  withGroup(
    {
      slug: 'users',
      admin: {
        useAsTitle: 'email',
      },
      auth: true,
      access: {
        admin: ({ req: { user } }) => {
          return Boolean(user?.roles?.includes('admin'))
        },
      },
      fields: [
        {
          name: 'roles',
          type: 'select',
          hasMany: true,
          defaultValue: ['user'],
          options: [
            { label: 'Admin', value: 'admin' },
            { label: 'User', value: 'user' },
          ],
        },
      ],
    },
    'Views',
  ),
]

export const baseConfig: Partial<Config> = {
  collections,
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es', 'de'],
  },
  admin: {
    autoLogin: {
      email: devUser.email,
      password: devUser.password,
      prefillOnly: true,
    },
    livePreview: {
      collections: [docControlsSlug],
      url: 'http://localhost:3001',
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      actions: [
        './components/HeaderAction.tsx#HeaderAction',
        './components/HeaderAction.tsx#HeaderAction2',
      ],
      beforeNavLinks: ['./views/Components/NavLink.js#ComponentsNavLink'],
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
        roles: ['admin'],
      },
    })

    await payload.create({
      collection: 'users',
      data: {
        email: 'user@payloadcms.com',
        password: 'test',
        roles: ['user'],
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

    // Create 15 posts to test join field pagination (defaultLimit: 3)
    for (let i = 1; i <= 15; i++) {
      await payload.create({
        collection: joinPostsSlug,
        data: {
          title: `Post ${i}`,
          _status: i % 2 === 0 ? 'published' : 'draft',
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

    // Add more root-level tags to test pagination (20+ total root tags)
    const additionalTags = [
      'Marketing',
      'Sales',
      'Finance',
      'HR',
      'Operations',
      'Legal',
      'Engineering',
      'Product',
      'Research',
      'Analytics',
      'Support',
      'Quality',
      'Security',
      'Infrastructure',
      'Data Science',
      'DevOps',
      'Mobile',
      'Cloud',
    ]

    for (const tagName of additionalTags) {
      await payload.create({
        collection: tagsSlug,
        data: { name: tagName },
      })
    }

    // Seed tag-items collection with 30 untagged items for hierarchy pagination testing
    for (let i = 1; i <= 30; i++) {
      await payload.create({
        collection: tagItemsSlug,
        data: {
          title: `Tag Item ${i}`,
          description: `Description for tag item ${i}`,
        },
      })
    }

    // Seed folders for hierarchy testing
    const rootFolder = await payload.create({
      collection: foldersSlug,
      data: { name: 'Root Folder' },
    })

    await payload.create({
      collection: foldersSlug,
      data: { name: 'Subfolder A', parent: rootFolder.id },
    })

    await payload.create({
      collection: foldersSlug,
      data: { name: 'Subfolder B', parent: rootFolder.id },
    })

    // Seed folder-items collection with 30 items (no folder assigned) for hierarchy pagination testing
    for (let i = 1; i <= 30; i++) {
      await payload.create({
        collection: folderItemsSlug,
        data: {
          title: `Folder Item ${i}`,
        },
      })
    }

    // Seed search-bar-test collection with 300 items for pagination testing
    const categories = ['news', 'blog', 'tutorial', 'docs']
    const statuses = ['draft', 'published', 'archived']

    for (let i = 1; i <= 300; i++) {
      const index = i.toString().padStart(3, '0')
      await payload.create({
        collection: 'search-bar-test',
        data: {
          title: `Document ${index}`,
          description: `Description for document ${index}`,
          category: categories[i % categories.length],
          status: statuses[i % statuses.length],
          priority: i,
        },
      })
    }

    // Seed orderable collection for testing drag-and-drop ordering
    const orderableItems = [
      { title: 'First Task', priority: 'high' },
      { title: 'Second Task', priority: 'medium' },
      { title: 'Third Task', priority: 'low' },
      { title: 'Fourth Task', priority: 'high' },
      { title: 'Fifth Task', priority: 'medium' },
    ]

    for (const item of orderableItems) {
      await payload.create({
        collection: orderableSlug,
        data: item,
      })
    }

    // Seed query presets for search-bar-test collection
    const presetAccessEveryone = {
      read: { constraint: 'everyone' },
      update: { constraint: 'everyone' },
      delete: { constraint: 'everyone' },
    }

    await payload.create({
      collection: 'payload-query-presets',
      data: {
        title: 'Published Only',
        relatedCollection: 'search-bar-test',
        isShared: true,
        access: presetAccessEveryone,
        where: {
          status: { equals: 'published' },
        },
      },
    })

    await payload.create({
      collection: 'payload-query-presets',
      data: {
        title: 'News Articles',
        relatedCollection: 'search-bar-test',
        isShared: true,
        access: presetAccessEveryone,
        where: {
          category: { equals: 'news' },
        },
      },
    })

    await payload.create({
      collection: 'payload-query-presets',
      data: {
        title: 'Drafts',
        relatedCollection: 'search-bar-test',
        isShared: true,
        access: presetAccessEveryone,
        where: {
          status: { equals: 'draft' },
        },
      },
    })

    // Seed draft-versions collection with many versions for pagination testing
    const { id: draftVersionsDocID } = await payload.create({
      collection: draftVersionsSlug,
      data: {
        title: 'Document With Many Versions',
        content: 'Initial content',
      },
      draft: true,
    })

    for (let i = 0; i < 20; i++) {
      await payload.update({
        id: draftVersionsDocID,
        collection: draftVersionsSlug,
        data: {
          title: `Document With Many Versions - v${i + 2}`,
          content: `Updated content version ${i + 2}`,
        },
      })
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
}
