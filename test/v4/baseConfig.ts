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
  nestedDrawersSlug,
  orderableSlug,
  relationshipFieldsSlug,
  richTextFieldsSlug,
  tagItemsSlug,
  tagsSlug,
  talksSlug,
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
import NestedDrawers from './collections/NestedDrawers/index.js'
import NumberFields from './collections/Number/index.js'
import Orderable from './collections/Orderable/index.js'
import PasswordFields from './collections/Password/index.js'
import PointFields from './collections/Point/index.js'
import RadioFields from './collections/Radio/index.js'
import RelationshipFields from './collections/Relationship/index.js'
import RichTextFields from './collections/RichText/index.js'
import RowFields from './collections/Row/index.js'
import { SearchBarTest } from './collections/SearchBarTest/index.js'
import SelectFields from './collections/Select/index.js'
import SlugFields from './collections/Slug/index.js'
import TabsFields from './collections/Tabs/index.js'
import TagItems from './collections/TagItems/index.js'
import Tags from './collections/Tags/index.js'
import Talks from './collections/Talks/index.js'
import TextFields from './collections/Text/index.js'
import TextareaFields from './collections/Textarea/index.js'
import Rubbish from './collections/Trash/index.js'
import RubbishWithDrafts from './collections/TrashWithDrafts/index.js'
import Unauthorized from './collections/Unauthorized/index.js'
import Uploads from './collections/Upload/index.js'
import UploadFields from './collections/UploadField/index.js'
import Users from './collections/Users/index.js'
import { VersionsDiff } from './collections/VersionsDiff/index.js'
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
  // Auth
  withGroup(Users, 'Auth'),
  // Elements
  withGroup(DocControls, 'Elements'),
  withGroup(NestedDrawers, 'Elements'),
  withGroup(Orderable, 'Elements'),
  withGroup(SearchBarTest, 'Elements'),
  withGroup(Talks, 'Elements'),
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
  // Hierarchy
  withGroup(Folders, 'Hierarchy'),
  withGroup(FolderItems, 'Hierarchy'),
  withGroup(Tags, 'Hierarchy'),
  withGroup(TagItems, 'Hierarchy'),
  // Trash
  withGroup(Rubbish, 'Trash'),
  withGroup(RubbishWithDrafts, 'Trash With Drafts'),
  // Uploads
  withGroup(Uploads, 'Uploads'),
  withGroup(UploadFields, 'Uploads'),
  // Versions
  withGroup(Autosave, 'Versions'),
  withGroup(VersionsDiff, 'Versions'),
  withGroup(DraftVersions, 'Versions'),
]

export const baseConfig: Partial<Config> = {
  admin: {
    autoLogin: {
      email: devUser.email,
      password: devUser.password,
      prefillOnly: true,
    },
    livePreview: {
      collections: [docControlsSlug],
      url: 'http://localhost:3000',
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
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections,
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es', 'de'],
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

    await payload.create({
      collection: 'users',
      data: {
        email: 'dev2@payloadcms.com',
        password: devUser.password,
        roles: ['admin'],
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
        limit: 1,
        where: { email: { equals: devUser.email } },
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
          code: codeContent,
          content: richTextContent,
          lists: listsContent,
          table: tableContent,
          title: 'Data harvest \u2013 how AI and sensors are revolutionizing farming',
          typography: getTypographyContent(formattedUserID),
        },
      })
    }

    // Seed relationship-fields to test join field
    const createdRelationship = await payload.create({
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
          _status: i % 2 === 0 ? 'published' : 'draft',
          category: joinCategory.id,
          title: `Post ${i}`,
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
          category: categories[i % categories.length],
          description: `Description for document ${index}`,
          priority: i,
          status: statuses[i % statuses.length],
          title: `Document ${index}`,
        },
      })
    }

    // Seed orderable collection for testing drag-and-drop ordering
    const orderableItems = [
      { priority: 'high', title: 'First Task' },
      { priority: 'medium', title: 'Second Task' },
      { priority: 'low', title: 'Third Task' },
      { priority: 'high', title: 'Fourth Task' },
      { priority: 'medium', title: 'Fifth Task' },
    ]

    for (const item of orderableItems) {
      await payload.create({
        collection: orderableSlug,
        data: item,
      })
    }

    // Seed query presets for search-bar-test collection
    const presetAccessEveryone = {
      delete: { constraint: 'everyone' },
      read: { constraint: 'everyone' },
      update: { constraint: 'everyone' },
    }

    await payload.create({
      collection: 'payload-query-presets',
      data: {
        access: presetAccessEveryone,
        isShared: true,
        relatedCollection: 'search-bar-test',
        title: 'Published Only',
        where: {
          status: { equals: 'published' },
        },
      },
    })

    await payload.create({
      collection: 'payload-query-presets',
      data: {
        access: presetAccessEveryone,
        isShared: true,
        relatedCollection: 'search-bar-test',
        title: 'News Articles',
        where: {
          category: { equals: 'news' },
        },
      },
    })

    await payload.create({
      collection: 'payload-query-presets',
      data: {
        access: presetAccessEveryone,
        isShared: true,
        relatedCollection: 'search-bar-test',
        title: 'Drafts',
        where: {
          status: { equals: 'draft' },
        },
      },
    })

    // Seed draft-versions collection with many versions for pagination testing
    const { id: draftVersionsDocID } = await payload.create({
      collection: draftVersionsSlug,
      data: {
        content: 'Initial content',
        title: 'Document With Many Versions',
      },
      draft: true,
    })

    for (let i = 0; i < 20; i++) {
      await payload.update({
        id: draftVersionsDocID,
        collection: draftVersionsSlug,
        data: {
          content: `Updated content version ${i + 2}`,
          title: `Document With Many Versions - v${i + 2}`,
        },
      })
    }

    // Seed talks showcase collection
    const existingUpload = await payload.find({
      collection: uploadsSlug,
      limit: 1,
    })
    const heroUploadID = existingUpload.docs[0]?.id

    const buildAbstract = (text: string) => ({
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text,
                version: 1,
              },
            ],
            direction: 'ltr' as const,
            format: '' as const,
            indent: 0,
            textFormat: 0,
            version: 1,
          },
        ],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
      },
    })

    const reactTalk = await payload.create({
      collection: talksSlug,
      data: {
        slug: 'server-components-in-production',
        _status: 'published',
        abstract: buildAbstract(
          'React Server Components reshape how we think about data fetching, bundling, and the boundary between server and client. This talk walks through a real-world migration of a 400-route admin panel.',
        ),
        attendeeCount: 412,
        capacity: 800,
        contactEmail: 'organizers@example.com',
        customCss: '.talk-hero { background: linear-gradient(135deg, #6366f1, #ec4899); }',
        customSchema: {
          name: 'Server Components in Production',
          '@context': 'https://schema.org',
          '@type': 'Event',
        },
        difficultyLevel: 'intermediate',
        durationMinutes: 45,
        endTime: '2026-09-15T15:45:00.000Z',
        gallery: heroUploadID
          ? [
              { caption: 'Speaker on the main stage', image: heroUploadID },
              { caption: 'Audience Q&A', image: heroUploadID },
            ]
          : [],
        heroImage: heroUploadID,
        internalNotes: {
          flagged: false,
          reviewerNotes: 'Strong technical talk, confirmed slot.',
        },
        isFeatured: true,
        isVirtual: false,
        keywords: ['react', 'rsc', 'next.js', 'performance'],
        languages: ['en'],
        metaDescription:
          'How we migrated a 400-route admin panel to React Server Components, with real benchmarks and trade-offs.',
        metaTitle: 'Server Components in Production — A Migration Retrospective',
        ogImage: heroUploadID,
        organizer: devUserDoc.id,
        priority: 9,
        recordingUrl: 'https://example.com/watch/rsc-prod',
        registrationDeadline: '2026-09-10T00:00:00.000Z',
        registrationUrl: 'https://example.com/register',
        resources: [
          { type: 'slides', label: 'Slide deck (PDF)', url: 'https://example.com/slides.pdf' },
          { type: 'code', label: 'Source code', url: 'https://github.com/example/rsc-demo' },
          { type: 'docs', label: 'Migration guide', url: 'https://example.com/guide' },
        ],
        room: 'Main Stage',
        sections: [
          {
            blockType: 'talk-hero',
            eyebrow: 'Keynote',
            heading: 'Server Components in Production',
            subheading: 'A 12-month migration retrospective.',
          },
          {
            attribution: 'Jordan Smith',
            blockType: 'talk-quote',
            quote:
              'We cut our largest route bundle by 67% — but the architectural shift mattered more than the bytes.',
            role: 'Staff Engineer',
          },
          {
            blockType: 'talk-cta',
            label: 'Read the full case study',
            style: 'primary',
            url: 'https://example.com/case-study',
          },
        ],
        shortDescription:
          'Lessons learned migrating a large admin app to React Server Components — what worked, what hurt, and what we would do again.',
        slidesUrl: 'https://example.com/slides/rsc-prod',
        startTime: '2026-09-15T15:00:00.000Z',
        status: 'confirmed',
        title: 'Server Components in Production',
        track: 'frontend',
        venueLocation: [-122.4194, 37.7749],
      },
    })

    const aiTalk = await payload.create({
      collection: talksSlug,
      data: {
        slug: 'llm-agents-without-the-hype',
        _status: 'published',
        abstract: buildAbstract(
          'Most "agent" demos collapse outside the happy path. This session shares the evaluation framework we use to ship agent features into a regulated product.',
        ),
        attendeeCount: 78,
        capacity: 120,
        contactEmail: 'ai-track@example.com',
        difficultyLevel: 'advanced',
        durationMinutes: 30,
        endTime: '2026-09-16T19:00:00.000Z',
        isFeatured: false,
        isVirtual: true,
        keywords: ['llm', 'agents', 'evals'],
        languages: ['en', 'es'],
        organizer: devUserDoc.id,
        priority: 6,
        registrationUrl: 'https://example.com/register/ai',
        relatedTalks: [reactTalk.id],
        resources: [
          { type: 'code', label: 'Eval harness repo', url: 'https://github.com/example/evals' },
        ],
        room: 'Workshop Room B',
        sections: [
          {
            blockType: 'talk-hero',
            heading: 'LLM Agents Without the Hype',
            subheading: 'Building evals before features.',
          },
        ],
        shortDescription:
          'A pragmatic look at when LLM agents help, when they make things worse, and the eval harness we built to tell the difference.',
        startTime: '2026-09-16T18:30:00.000Z',
        status: 'accepted',
        title: 'LLM Agents Without the Hype',
        track: 'ai-ml',
      },
    })

    await payload.create({
      collection: talksSlug,
      data: {
        slug: 'designing-indexes-for-search',
        _status: 'draft',
        attendeeCount: 0,
        difficultyLevel: 'intermediate',
        durationMinutes: 25,
        isFeatured: false,
        isVirtual: false,
        keywords: ['postgres', 'indexes', 'search'],
        languages: ['en'],
        organizer: devUserDoc.id,
        priority: 4,
        relatedTalks: [reactTalk.id, aiTalk.id],
        shortDescription:
          'A proposal walkthrough — we have not been accepted yet, but here is the outline.',
        status: 'proposed',
        title: 'Designing Database Indexes for Search',
        track: 'backend',
      },
      draft: true,
    })

    // Seed nested-drawers collection: a chain of docs linked via the
    // self-referencing `child` field so drawers can be drilled into.
    let previousNestedChild: number | string | undefined
    for (let i = 5; i >= 1; i--) {
      const created = await payload.create({
        collection: nestedDrawersSlug,
        data: {
          title: `Nested Drawer ${i}`,
          child: previousNestedChild as string,
          publishedAt: new Date().toISOString(),
          relatedRelationship: createdRelationship.id,
          relatedText: createdPosts[i - 1]?.id as string,
          status: i % 2 === 0 ? 'published' : 'draft',
        },
      })
      previousNestedChild = created.id
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
}
