/* eslint-disable @typescript-eslint/ban-ts-comment */
import path from 'path'

import type { CollectionConfig } from '../../packages/payload/src/collections/config/types'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import ArrayFields from './collections/Array'
import BlockFields from './collections/Blocks'
import CheckboxFields from './collections/Checkbox'
import CodeFields from './collections/Code'
import CollapsibleFields from './collections/Collapsible'
import ConditionalLogic from './collections/ConditionalLogic'
import DateFields from './collections/Date'
import GroupFields from './collections/Group'
import IndexedFields from './collections/Indexed'
import JSONFields from './collections/JSON'
import { LexicalFields } from './collections/Lexical'
import { LexicalMigrateFields } from './collections/LexicalMigrate'
import NumberFields from './collections/Number'
import SeoPlugin from './collections/PluginSeo/PluginSeo'
import PointFields from './collections/Point'
import RadioFields from './collections/Radio'
import RelationshipFields from './collections/Relationship'
import RichTextFields from './collections/RichText'
import RowFields from './collections/Row'
import SelectFields from './collections/Select'
import TabsFields from './collections/Tabs'
import TextFields from './collections/Text'
import Uploads from './collections/Upload'
import Uploads2 from './collections/Upload2'
import Uploads3 from './collections/Uploads3'
import TabsWithRichText from './globals/TabsWithRichText'
import { clearAndSeedEverything } from './seed'

export const collectionSlugs: CollectionConfig[] = [
  LexicalFields,
  LexicalMigrateFields,
  {
    admin: {
      useAsTitle: 'email',
    },
    auth: true,
    fields: [
      {
        name: 'canViewConditionalField',
        defaultValue: true,
        type: 'checkbox',
      },
    ],
    slug: 'users',
  },
  ArrayFields,
  BlockFields,
  CheckboxFields,
  CodeFields,
  CollapsibleFields,
  ConditionalLogic,
  DateFields,
  RadioFields,
  GroupFields,
  RowFields,
  IndexedFields,
  JSONFields,
  NumberFields,
  PointFields,
  RelationshipFields,
  RichTextFields,
  SelectFields,
  TabsFields,
  TextFields,
  Uploads,
  Uploads2,
  Uploads3,
  SeoPlugin,
]

export default buildConfigWithDefaults({
  admin: {
    webpack: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config?.resolve?.alias,
          fs: path.resolve(__dirname, './mocks/emptyModule.js'),
        },
      },
    }),
  },
  collections: collectionSlugs,
  globals: [TabsWithRichText],
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es'],
  },
  onInit: async (payload) => {
    await clearAndSeedEverything(payload)
  },
})
