import { uploadsSlug } from '../slugs.js'

export function getRichTextContent(
  formattedUploadID: number | string,
  formattedUserID?: number | string,
) {
  return JSON.parse(
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
          ...(formattedUserID !== undefined
            ? [
                {
                  type: 'relationship',
                  version: 3,
                  format: '',
                  relationTo: 'users',
                  value: '{{USER_ID}}',
                },
              ]
            : []),
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
    })
      .replace(/"\{\{UPLOAD_ID\}\}"/g, `${formattedUploadID}`)
      .replace(/"\{\{USER_ID\}\}"/g, formattedUserID !== undefined ? `${formattedUserID}` : '""'),
  )
}

export function getTypographyContent(formattedUserID?: number | string) {
  return JSON.parse(
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
          {
            type: 'paragraph',
            version: 1,
            direction: 'ltr',
            format: '',
            indent: 0,
            textFormat: 0,
            children: [
              {
                type: 'link',
                version: 3,
                direction: 'ltr',
                format: '',
                indent: 0,
                fields: {
                  linkType: 'custom',
                  newTab: false,
                  url: 'https://figma.com',
                },
                children: [
                  {
                    type: 'text',
                    version: 1,
                    text: 'External link',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                  },
                ],
              },
            ],
          },
          ...(formattedUserID !== undefined
            ? [
                {
                  type: 'paragraph',
                  version: 1,
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  textFormat: 0,
                  children: [
                    {
                      type: 'link',
                      version: 3,
                      direction: 'ltr',
                      format: '',
                      indent: 0,
                      fields: {
                        linkType: 'internal',
                        newTab: false,
                        doc: {
                          value: '{{USER_ID}}',
                          relationTo: 'users',
                        },
                      },
                      children: [
                        {
                          type: 'text',
                          version: 1,
                          text: 'Internal link',
                          detail: 0,
                          format: 0,
                          mode: 'normal',
                          style: '',
                        },
                      ],
                    },
                  ],
                },
              ]
            : []),
          {
            type: 'paragraph',
            version: 1,
            direction: 'ltr',
            format: '',
            indent: 0,
            textFormat: 0,
            children: [
              {
                type: 'link',
                version: 3,
                direction: 'ltr',
                format: '',
                indent: 0,
                fields: {
                  linkType: 'custom',
                  newTab: true,
                  url: 'https://figma.com',
                },
                children: [
                  {
                    type: 'text',
                    version: 1,
                    text: 'External link (new tab)',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                  },
                ],
              },
            ],
          },
        ],
      },
    }).replace(/"\{\{USER_ID\}\}"/g, formattedUserID !== undefined ? `${formattedUserID}` : '""'),
  )
}

const textNode = (text: string) => ({
  type: 'text',
  version: 1,
  text,
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
})

const listItem = (indent: number, value: number, children: object[]) => ({
  type: 'listitem',
  version: 1,
  direction: 'ltr' as const,
  format: '',
  indent,
  value,
  children,
})

const checkListItem = (indent: number, value: number, checked: boolean, children: object[]) => ({
  type: 'listitem',
  version: 1,
  direction: 'ltr' as const,
  format: '',
  indent,
  value,
  checked,
  children,
})

const nestedList = (
  listType: 'bullet' | 'check' | 'number',
  tag: 'ol' | 'ul',
  children: object[],
) => ({
  type: 'list',
  listType,
  start: 1,
  tag,
  version: 1,
  direction: null,
  format: '',
  indent: 0,
  children,
})

export const listsContent = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: null,
    children: [
      // Ordered list with nested levels
      nestedList('number', 'ol', [
        listItem(0, 1, [textNode('Lorem')]),
        listItem(0, 2, [
          nestedList('number', 'ol', [
            listItem(1, 1, [textNode('Ipsum')]),
            listItem(1, 2, [
              nestedList('number', 'ol', [
                listItem(2, 1, [textNode('Dolor')]),
                listItem(2, 2, [
                  nestedList('number', 'ol', [
                    listItem(3, 1, [textNode('Sit')]),
                    listItem(3, 2, [
                      nestedList('number', 'ol', [listItem(4, 1, [textNode('Amet')])]),
                    ]),
                  ]),
                ]),
              ]),
            ]),
          ]),
        ]),
      ]),
      // Unordered list with nested levels
      nestedList('bullet', 'ul', [
        listItem(0, 1, [textNode('Lorem')]),
        listItem(0, 2, [
          nestedList('bullet', 'ul', [
            listItem(1, 1, [textNode('Ipsum')]),
            listItem(1, 2, [
              nestedList('bullet', 'ul', [
                listItem(2, 1, [textNode('Dolor')]),
                listItem(2, 2, [
                  nestedList('bullet', 'ul', [
                    listItem(3, 1, [textNode('Sit')]),
                    listItem(3, 2, [
                      nestedList('bullet', 'ul', [listItem(4, 1, [textNode('Amet')])]),
                    ]),
                  ]),
                ]),
              ]),
            ]),
          ]),
        ]),
      ]),
      // Checklist with mixed checked/unchecked states and nested levels
      nestedList('check', 'ul', [
        checkListItem(0, 1, false, [textNode('Lorem')]),
        checkListItem(0, 2, true, [textNode('Ipsum')]),
        checkListItem(0, 3, false, [
          nestedList('check', 'ul', [
            checkListItem(1, 1, false, [textNode('Dolor')]),
            checkListItem(1, 2, true, [textNode('Sit')]),
            checkListItem(1, 3, false, [
              nestedList('check', 'ul', [checkListItem(2, 1, true, [textNode('Amet')])]),
            ]),
          ]),
        ]),
      ]),
    ],
  },
}

const tableCell = (text: string, headerState: 0 | 1 = 0) => ({
  type: 'tablecell',
  version: 1,
  direction: null,
  format: '',
  indent: 0,
  backgroundColor: null,
  colSpan: 1,
  rowSpan: 1,
  headerState,
  children: [
    {
      type: 'paragraph',
      version: 1,
      direction: null,
      format: '',
      indent: 0,
      textFormat: 0,
      textStyle: '',
      children: [
        { type: 'text', version: 1, detail: 0, format: 0, mode: 'normal', style: '', text },
      ],
    },
  ],
})

const tableRow = (cells: ReturnType<typeof tableCell>[]) => ({
  type: 'tablerow',
  version: 1,
  direction: null,
  format: '',
  indent: 0,
  children: cells,
})

export const tableContent = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    children: [
      {
        type: 'table',
        version: 1,
        direction: null,
        format: '',
        indent: 0,
        children: [
          tableRow([
            tableCell('Crop', 1),
            tableCell('Yield (t/ha)', 1),
            tableCell('Season', 1),
            tableCell('Region', 1),
          ]),
          tableRow([
            tableCell('Wheat'),
            tableCell('3.2'),
            tableCell('Spring'),
            tableCell('Midwest'),
          ]),
          tableRow([
            tableCell('Corn'),
            tableCell('9.4'),
            tableCell('Summer'),
            tableCell('Great Plains'),
          ]),
          tableRow([
            tableCell('Soybeans'),
            tableCell('2.8'),
            tableCell('Fall'),
            tableCell('Southeast'),
          ]),
          tableRow([tableCell('Rice'), tableCell('7.1'), tableCell('Monsoon'), tableCell('Delta')]),
        ],
      },
    ],
  },
}

export const codeContent = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: null,
    children: [
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
            text: 'Precision agriculture technologies allow farmers to monitor and respond to field conditions with unprecedented granularity, reducing waste while improving yields.',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
          },
        ],
      },
      {
        type: 'block',
        version: 2,
        format: '',
        fields: {
          id: '6a7b8c9d0e1f2a3b4c5d6e7f',
          blockName: '',
          blockType: 'Code',
          code: "import { mongooseAdapter } from '@payloadcms/db-mongodb'\nimport sharp from 'sharp'\nimport path from 'path'\nimport { buildConfig, PayloadRequest } from 'payload'\nimport { fileURLToPath } from 'url'\n\nimport { Categories } from './collections/Categories'\nimport { Media } from './collections/Media'\nimport { Pages } from './collections/Pages'\nimport { Posts } from './collections/Posts'\nimport { Users } from './collections/Users'\nimport { Footer } from './Footer/config'\nimport { Header } from './Header/config'\nimport { plugins } from './plugins'\nimport { defaultLexical } from '@/fields/defaultLexical'\nimport { getServerSideURL } from './utilities/getURL'\n\nconst filename = fileURLToPath(import.meta.url)\nconst dirname = path.dirname(filename)\n\nexport default buildConfig({\n  admin: {\n    components: {\n      beforeLogin: ['@/components/BeforeLogin'],\n      beforeDashboard: ['@/components/BeforeDashboard'],\n    },\n    importMap: {\n      baseDir: path.resolve(dirname),\n    },\n    user: Users.slug,\n  },\n  editor: defaultLexical,\n  db: mongooseAdapter({\n    url: process.env.DATABASE_URI,\n  }),\n  collections: [Pages, Posts, Media, Categories, Users],\n  cors: [getServerSideURL()].filter(Boolean),\n  globals: [Header, Footer],\n  plugins: [\n    ...plugins,\n  ],\n  secret: process.env.PAYLOAD_SECRET,\n  sharp,\n  typescript: {\n    outputFile: path.resolve(dirname, 'payload-types.ts'),\n  },\n  jobs: {\n    access: {\n      run: ({ req }: { req: PayloadRequest }): boolean => {\n        if (req.user) return true\n\n        const authHeader = req.headers.get('authorization')\n        return authHeader === `Bearer ${process.env.CRON_SECRET}`\n      },\n    },\n    tasks: [],\n  },\n})",
          language: 'typescript',
        },
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
        type: 'horizontalrule',
        version: 1,
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
            text: 'Consumers also benefit from eco-friendly and ',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
          },
          {
            type: 'link',
            version: 3,
            direction: 'ltr',
            format: '',
            indent: 0,
            fields: {
              linkType: 'custom',
              newTab: false,
              url: 'https://payloadcms.com',
            },
            children: [
              {
                type: 'text',
                version: 1,
                text: 'organic farming practices',
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
              },
            ],
          },
          {
            type: 'text',
            version: 1,
            text: '. Organic foods are often more nutrient-dense and have higher levels of antioxidants than conventionally-grown foods. Furthermore, because organic farmers prioritize soil health and biodiversity, they are often better equipped to adapt to changing climate conditions and produce more resilient crops. Organic farming practices can also help to reduce exposure to harmful chemicals, as organic food is grown without synthetic pesticides and fertilizers.',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
          },
        ],
      },
    ],
  },
}
