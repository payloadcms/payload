import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { getFileByPath } from 'payload'

import type { PayloadContractorAppContent } from './payload-types.js'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { ContractorAppContent } from './collections/Contractors/index.js'
import { MediaCollection } from './collections/Media/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'
import { MenuGlobal } from './globals/Menu/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const richTextData: PayloadContractorAppContent['section2']['description'] = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'This is some rich text',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
}

export default buildConfigWithDefaults({
  // ...extend config here
  collections: [PostsCollection, MediaCollection, ContractorAppContent],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  editor: lexicalEditor({}),
  globals: [
    // ...add more globals here
    MenuGlobal,
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    await payload.create({
      collection: postsSlug,
      data: {
        title: 'example post',
      },
    })

    const file = await getFileByPath(path.resolve(dirname, '../uploads/test-image.jpg'))

    const mediaDoc = await payload.create({
      collection: 'media',
      data: {},
      file,
    })

    await payload.create({
      collection: 'payload-contractor-app-content',
      data: {
        title: 'example contractor app content',
        heroBanner: {
          heading: 'Welcome to the Contractor App',
          description: 'This is the hero banner for contractors.',
          image: mediaDoc.id,
        },
        section1: {
          heading: 'Getting Started',
          brands: [
            {
              brandImage: mediaDoc.id,
            },
            {
              brandImage: mediaDoc.id,
            },
            {
              brandImage: mediaDoc.id,
            },
          ],
        },
        section2: {
          heading: 'Features',
          description: richTextData,
          // media: mediaDoc.id, // this is a video
          howItWorksUrl: 'https://example.com/how-it-works',
        },
        section3: {
          heading: 'Contact Us',
          description: richTextData,
          media: mediaDoc.id,
        },
        section4: {
          testimonials: [
            {
              testimonialTitle: 'Great Service',
              testimonialDescription: richTextData,
              testimonialImage: mediaDoc.id,
            },
          ],
        },
        section5: {
          heading: 'Join Now',
          description: richTextData,
          steps: [
            {
              stepTitle: '1',
              stepDescription: richTextData,
              stepImage: mediaDoc.id,
            },
            {
              stepTitle: '2',
              stepDescription: richTextData,
              stepImage: mediaDoc.id,
            },
            {
              stepTitle: '3',
              stepDescription: richTextData,
              stepImage: mediaDoc.id,
            },
          ],
        },
        section6: {
          heading: 'FAQs',
          description: richTextData,
          team: [
            {
              teamMemberName: 'John Doe',
              teamMemberPosition: 'Project Manager',
              teamMemberImage: mediaDoc.id,
              teamMemberAddress: '123 Main St, Anytown, USA',
              teamMemberPhone: '123-456-7890',
              teamMemberEmail: 'email@example.com',
            },
          ],
        },
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
