import { fileURLToPath } from 'node:url'
import path from 'path'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import type { CollectionConfig } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import {
  customSeparatorPagesSlug,
  explicitStoredPagesSlug,
  localizedSlugPagesSlug,
  localizedTitlePagesSlug,
  nestedDocsPagesSlug,
  usersSlug,
} from './shared.js'

const Users: CollectionConfig = {
  slug: usersSlug,
  auth: true,
  fields: [],
}

const NestedDocsPages: CollectionConfig = {
  slug: nestedDocsPagesSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      localized: true,
      required: true,
    },
  ],
  nestedDocs: true,
  versions: {
    drafts: true,
  },
}

const ExplicitStoredPages: CollectionConfig = {
  slug: explicitStoredPagesSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
  hierarchy: {
    parentFieldName: '_h_explicitStoredPages',
    pathStrategy: 'stored',
  },
}

const CustomSeparatorPages: CollectionConfig = {
  slug: customSeparatorPagesSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
    },
  ],
  nestedDocs: {
    titlePathSeparator: ' › ',
  },
}

const LocalizedTitlePages: CollectionConfig = {
  slug: localizedTitlePagesSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
    },
  ],
  hierarchy: {
    parentFieldName: 'parent',
    pathStrategy: 'stored',
    slugField: 'slug',
  },
  versions: {
    drafts: true,
  },
}

const LocalizedSlugPages: CollectionConfig = {
  slug: localizedSlugPagesSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      localized: true,
      required: true,
    },
  ],
  hierarchy: {
    parentFieldName: 'parent',
    pathStrategy: 'stored',
    slugField: 'slug',
  },
}

export default buildConfigWithDefaults({
  collections: [
    Users,
    NestedDocsPages,
    ExplicitStoredPages,
    CustomSeparatorPages,
    LocalizedTitlePages,
    LocalizedSlugPages,
  ],
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es', 'de'],
  },
  onInit: async (payload) => {
    await payload.create({
      collection: usersSlug,
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
