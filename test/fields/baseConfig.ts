import type { CollectionConfig, Config } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import ArrayFields from './collections/Array/index.js'
import { BlockFields } from './collections/Blocks/index.js'
import CheckboxFields from './collections/Checkbox/index.js'
import CodeFields from './collections/Code/index.js'
import CollapsibleFields from './collections/Collapsible/index.js'
import ConditionalLogic from './collections/ConditionalLogic/index.js'
import { CustomRowID } from './collections/CustomID/CustomRowID.js'
import { CustomTabID } from './collections/CustomID/CustomTabID.js'
import { CustomID } from './collections/CustomID/index.js'
import { CustomIDNested } from './collections/CustomIDNested/index.js'
import DateFields from './collections/Date/index.js'
import EmailFields from './collections/Email/index.js'
import GroupFields from './collections/Group/index.js'
import IndexedFields from './collections/Indexed/index.js'
import JSONFields from './collections/JSON/index.js'
import NumberFields from './collections/Number/index.js'
import PointFields from './collections/Point/index.js'
import RadioFields from './collections/Radio/index.js'
import RelationshipFields from './collections/Relationship/index.js'
import RowFields from './collections/Row/index.js'
import SelectFields from './collections/Select/index.js'
import SelectVersionsFields from './collections/SelectVersions/index.js'
import SlugField from './collections/SlugField/index.js'
import TabsFields from './collections/Tabs/index.js'
import { TabsFields2 } from './collections/Tabs2/index.js'
import TextFields from './collections/Text/index.js'
import TextareaFields from './collections/Textarea/index.js'
import UIFields from './collections/UI/index.js'
import Uploads from './collections/Upload/index.js'
import Uploads2 from './collections/Upload2/index.js'
import UploadsMulti from './collections/UploadMulti/index.js'
import UploadsMultiPoly from './collections/UploadMultiPoly/index.js'
import UploadsPoly from './collections/UploadPoly/index.js'
import UploadRestricted from './collections/UploadRestricted/index.js'
import Uploads3 from './collections/Uploads3/index.js'
import { seed } from './seed.js'

export const collections: CollectionConfig[] = [
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
  SelectVersionsFields,
  ArrayFields,
  BlockFields,
  CheckboxFields,
  CodeFields,
  CollapsibleFields,
  ConditionalLogic,
  CustomID,
  CustomIDNested,
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
  SelectFields,
  SlugField,
  TabsFields2,
  TabsFields,
  TextFields,
  TextareaFields,
  Uploads,
  Uploads2,
  Uploads3,
  UploadsMulti,
  UploadsPoly,
  UploadsMultiPoly,
  UploadRestricted,
  UIFields,
]

export const baseConfig: Partial<Config> = {
  collections,
  blocks: [
    {
      slug: 'ConfigBlockTest',
      fields: [
        {
          name: 'deduplicatedText',
          type: 'text',
        },
      ],
    },
    {
      slug: 'localizedTextReference',
      fields: [
        {
          name: 'text',
          type: 'text',
          localized: true,
        },
      ],
    },
    {
      slug: 'localizedTextReference2',
      fields: [
        {
          name: 'text',
          type: 'text',
          localized: true,
        },
      ],
    },
  ],
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
    timezones: {
      supportedTimezones: ({ defaultTimezones }) => [
        ...defaultTimezones,
        { label: '(GMT-6) Monterrey, Nuevo Leon', value: 'America/Monterrey' },
        { label: 'Custom UTC', value: 'UTC' },
      ],
      defaultTimezone: 'America/Monterrey',
    },
  },
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es'],
  },
  onInit: async (payload) => {
    if (process.env.SEED_IN_CONFIG_ONINIT !== 'false') {
      await seed(payload)
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
}
