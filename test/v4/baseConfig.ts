import type { CollectionConfig, Config } from 'payload'

import { getFileByPath } from 'payload'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { devUser } from '../credentials.js'
import { richTextFieldsSlug, uploadsSlug } from './slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import ArrayFields from './collections/Array/index.js'
import BlocksFields from './collections/Blocks/index.js'
import CheckboxFields from './collections/Checkbox/index.js'
import CodeFields from './collections/Code/index.js'
import CollapsibleFields from './collections/Collapsible/index.js'
import DateFields from './collections/Date/index.js'
import EmailFields from './collections/Email/index.js'
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
]

export const baseConfig: Partial<Config> = {
  collections,
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  onInit: async (payload) => {
    const usersCount = await payload.count({ collection: 'users' })
    if (usersCount.totalDocs === 0) {
      await payload.create({
        collection: 'users',
        data: {
          email: devUser.email,
          password: devUser.password,
        },
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

      const richTextContent = JSON.parse(
        JSON.stringify({
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'heading',
                tag: 'h1',
                version: 1,
                direction: 'ltr',
                format: '',
                indent: 0,
                children: [
                  {
                    type: 'text',
                    version: 1,
                    text: 'Data harvest \u2013 how AI and sensors are revolutionizing farming',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                  },
                ],
              },
              {
                type: 'paragraph',
                version: 1,
                direction: 'ltr',
                format: '',
                indent: 0,
                textFormat: 0,
                children: [
                  {
                    type: 'text',
                    version: 1,
                    text: 'Precision agriculture technologies allow farmers to monitor and respond to field conditions with unprecedented granularity, reducing waste while improving yields. Smart sensors, drones, and AI are making farming more efficient and sustainable.',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                  },
                ],
              },
              {
                type: 'upload',
                version: 3,
                format: '',
                relationTo: uploadsSlug,
                value: '{{UPLOAD_ID}}',
              },
              {
                type: 'heading',
                tag: 'h6',
                version: 1,
                direction: 'ltr',
                format: '',
                indent: 0,
                children: [
                  {
                    type: 'text',
                    version: 1,
                    text: 'IN THE SOIL',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                  },
                ],
              },
              {
                type: 'paragraph',
                version: 1,
                direction: 'ltr',
                format: '',
                indent: 0,
                textFormat: 0,
                children: [
                  {
                    type: 'text',
                    version: 1,
                    text: 'Eco-friendly and organic farming not only benefit the environment, but they also support the local economy. By using sustainable practices, farmers can reduce their dependence on expensive synthetic inputs, resulting in lower production costs and higher profits. Additionally, because eco-friendly and organic farming often rely on smaller-scale, local production, they provide economic opportunities for small farmers and rural communities.',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                  },
                ],
              },
              {
                type: 'paragraph',
                version: 1,
                direction: 'ltr',
                format: '',
                indent: 0,
                textFormat: 0,
                children: [
                  {
                    type: 'text',
                    version: 1,
                    text: 'Consumers also benefit from eco-friendly and organic farming practices. Organic foods are often more nutrient-dense and have higher levels of antioxidants than conventionally-grown foods. Furthermore, because organic farmers prioritize soil health and biodiversity, they are often better equipped to adapt to changing climate conditions and produce more resilient crops. Organic farming practices can also help to reduce exposure to harmful chemicals, as organic food is grown without synthetic pesticides and fertilizers.',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                  },
                ],
              },
            ],
          },
        }).replace(/"\{\{UPLOAD_ID\}\}"/g, `${formattedUploadID}`),
      )

      await payload.create({
        collection: richTextFieldsSlug,
        data: {
          title: 'Data harvest – how AI and sensors are revolutionizing farming',
          content: richTextContent,
          typography: {
            root: {
              type: 'root',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'heading',
                  tag: 'h1',
                  version: 1,
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  children: [
                    {
                      type: 'text',
                      version: 1,
                      text: 'Heading 1',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                    },
                  ],
                },
                {
                  type: 'heading',
                  tag: 'h2',
                  version: 1,
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  children: [
                    {
                      type: 'text',
                      version: 1,
                      text: 'Heading 2',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                    },
                  ],
                },
                {
                  type: 'heading',
                  tag: 'h3',
                  version: 1,
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  children: [
                    {
                      type: 'text',
                      version: 1,
                      text: 'Heading 3',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                    },
                  ],
                },
                {
                  type: 'heading',
                  tag: 'h4',
                  version: 1,
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  children: [
                    {
                      type: 'text',
                      version: 1,
                      text: 'Heading 4',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                    },
                  ],
                },
                {
                  type: 'heading',
                  tag: 'h5',
                  version: 1,
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  children: [
                    {
                      type: 'text',
                      version: 1,
                      text: 'Heading 5',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                    },
                  ],
                },
                {
                  type: 'heading',
                  tag: 'h6',
                  version: 1,
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  children: [
                    {
                      type: 'text',
                      version: 1,
                      text: 'Heading 6',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  version: 1,
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  textFormat: 0,
                  children: [
                    {
                      type: 'text',
                      version: 1,
                      text: 'Precision agriculture technologies allow farmers to monitor and respond to field conditions with unprecedented granularity, reducing waste while improving yields. Smart sensors, drones, and AI are making farming more efficient and sustainable.',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  version: 1,
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  textFormat: 0,
                  children: [
                    {
                      type: 'text',
                      version: 1,
                      text: 'Strikethrough',
                      detail: 0,
                      format: 4,
                      mode: 'normal',
                      style: '',
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  version: 1,
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  textFormat: 0,
                  children: [
                    {
                      type: 'text',
                      version: 1,
                      text: 'Super',
                      detail: 0,
                      format: 64,
                      mode: 'normal',
                      style: '',
                    },
                    {
                      type: 'text',
                      version: 1,
                      text: 'script, ',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                    },
                    {
                      type: 'text',
                      version: 1,
                      text: 'Sub',
                      detail: 0,
                      format: 32,
                      mode: 'normal',
                      style: '',
                    },
                    {
                      type: 'text',
                      version: 1,
                      text: 'script',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  version: 1,
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  textFormat: 0,
                  children: [
                    {
                      type: 'text',
                      version: 1,
                      text: 'inline code',
                      detail: 0,
                      format: 16,
                      mode: 'normal',
                      style: '',
                    },
                  ],
                },
              ],
            },
          },
        },
      })
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
}
