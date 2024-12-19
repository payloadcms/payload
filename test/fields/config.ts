import type { CollectionConfig } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import ArrayFields from './collections/Array/index.js'
import BlockFields from './collections/Blocks/index.js'
import CheckboxFields from './collections/Checkbox/index.js'
import CodeFields from './collections/Code/index.js'
import CollapsibleFields from './collections/Collapsible/index.js'
import ConditionalLogic from './collections/ConditionalLogic/index.js'
import { CustomRowID } from './collections/CustomID/CustomRowID.js'
import { CustomTabID } from './collections/CustomID/CustomTabID.js'
import { CustomID } from './collections/CustomID/index.js'
import DateFields from './collections/Date/index.js'
import EmailFields from './collections/Email/index.js'
import GroupFields from './collections/Group/index.js'
import IndexedFields from './collections/Indexed/index.js'
import JSONFields from './collections/JSON/index.js'
import { LexicalFields } from './collections/Lexical/index.js'
import { LexicalInBlock } from './collections/LexicalInBlock/index.js'
import { LexicalLocalizedFields } from './collections/LexicalLocalized/index.js'
import { LexicalMigrateFields } from './collections/LexicalMigrate/index.js'
import { LexicalObjectReferenceBugCollection } from './collections/LexicalObjectReferenceBug/index.js'
import { LexicalRelationshipsFields } from './collections/LexicalRelationships/index.js'
import NumberFields from './collections/Number/index.js'
import PointFields from './collections/Point/index.js'
import RadioFields from './collections/Radio/index.js'
import RelationshipFields from './collections/Relationship/index.js'
import RichTextFields from './collections/RichText/index.js'
import RowFields from './collections/Row/index.js'
import SelectFields from './collections/Select/index.js'
import TabsFields from './collections/Tabs/index.js'
import { TabsFields2 } from './collections/Tabs2/index.js'
import TextFields from './collections/Text/index.js'
import UIFields from './collections/UI/index.js'
import Uploads from './collections/Upload/index.js'
import Uploads2 from './collections/Upload2/index.js'
import UploadsMulti from './collections/UploadMulti/index.js'
import UploadsMultiPoly from './collections/UploadMultiPoly/index.js'
import UploadsPoly from './collections/UploadPoly/index.js'
import UploadRestricted from './collections/UploadRestricted/index.js'
import Uploads3 from './collections/Uploads3/index.js'
import TabsWithRichText from './globals/TabsWithRichText.js'
import { clearAndSeedEverything } from './seed.js'

export const collectionSlugs: CollectionConfig[] = [
  LexicalFields,
  LexicalMigrateFields,
  LexicalLocalizedFields,
  LexicalObjectReferenceBugCollection,
  {
    slug: 'users',
    admin: {
      useAsTitle: 'email',
    },
    auth: true,
    fields: [
      {
        name: 'canViewConditionalField',
        type: 'checkbox',
        defaultValue: true,
      },
    ],
  },
  LexicalInBlock,

  ArrayFields,
  BlockFields,
  CheckboxFields,
  CodeFields,
  CollapsibleFields,
  ConditionalLogic,
  CustomID,
  CustomTabID,
  CustomRowID,
  DateFields,
  EmailFields,
  RadioFields,
  GroupFields,
  RowFields,
  IndexedFields,
  JSONFields,
  NumberFields,
  PointFields,
  RelationshipFields,
  LexicalRelationshipsFields,
  RichTextFields,
  SelectFields,
  TabsFields2,
  TabsFields,
  TextFields,
  Uploads,
  Uploads2,
  Uploads3,
  UploadsMulti,
  UploadsPoly,
  UploadsMultiPoly,
  UploadRestricted,
  UIFields,
]

export default buildConfigWithDefaults({
  collections: collectionSlugs,
  globals: [TabsWithRichText],
  custom: {
    client: {
      'new-value': 'client available',
    },
    server: {
      'new-server-value': 'only available on server',
    },
  },
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      afterNavLinks: ['/components/AfterNavLinks.js#AfterNavLinks'],
    },
    custom: {
      client: {
        'new-value': 'client available',
      },
    },
  },
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es'],
  },
  onInit: async (payload) => {
    if (process.env.SEED_IN_CONFIG_ONINIT !== 'false') {
      await clearAndSeedEverything(payload)
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
