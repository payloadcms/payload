import type { CollectionConfig } from 'payload/types'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import ArrayFields from './collections/Array/index.js'
import BlockFields from './collections/Blocks/index.js'
import CheckboxFields from './collections/Checkbox/index.js'
import CodeFields from './collections/Code/index.js'
import CollapsibleFields from './collections/Collapsible/index.js'
import ConditionalLogic from './collections/ConditionalLogic/index.js'
import DateFields from './collections/Date/index.js'
import GroupFields from './collections/Group/index.js'
import IndexedFields from './collections/Indexed/index.js'
import JSONFields from './collections/JSON/index.js'
import { LexicalFields } from './collections/Lexical/index.js'
import { LexicalLocalizedFields } from './collections/LexicalLocalized/index.js'
import { LexicalMigrateFields } from './collections/LexicalMigrate/index.js'
import NumberFields from './collections/Number/index.js'
import PointFields from './collections/Point/index.js'
import RadioFields from './collections/Radio/index.js'
import RelationshipFields from './collections/Relationship/index.js'
import RichTextFields from './collections/RichText/index.js'
import RowFields from './collections/Row/index.js'
import SelectFields from './collections/Select/index.js'
import TabsFields from './collections/Tabs/index.js'
import TextFields from './collections/Text/index.js'
import Uploads from './collections/Upload/index.js'
import Uploads2 from './collections/Upload2/index.js'
import Uploads3 from './collections/Uploads3/index.js'
import TabsWithRichText from './globals/TabsWithRichText.js'
import { clearAndSeedEverything } from './seed.js'

export const collectionSlugs: CollectionConfig[] = [
  LexicalFields,
  LexicalMigrateFields,
  LexicalLocalizedFields,
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
]

export default buildConfigWithDefaults({
  collections: collectionSlugs,
  globals: [TabsWithRichText],
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
})
