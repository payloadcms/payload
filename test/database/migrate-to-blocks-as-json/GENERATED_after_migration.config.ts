import { fileURLToPath } from 'node:url'
import path from 'path'
import { buildConfig } from 'payload'

import './payload-types.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const { databaseAdapter } = await import('../../databaseAdapter.js')
const adapterFactory = ({ blocksAsJSON = false }: { blocksAsJSON?: boolean }) => {
  const init = databaseAdapter.init
  databaseAdapter.init = ({ payload }) => {
    const res = init({ payload })
    res.blocksAsJSON = blocksAsJSON
    res.migrationDir = path.resolve(dirname, 'migrations')
    res.push = false
    return res
  }
  return databaseAdapter
}
export default buildConfig({
  secret: '__',
  db: adapterFactory({ blocksAsJSON: true }),
  localization: {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
  },
  collections: [
    {
      slug: 'relation',
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    {
      slug: 'posts-versioned',
      versions: {
        drafts: true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'content',
          type: 'blocks',
          blocks: [
            {
              slug: 'textBlock',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
                {
                  name: 'relation',
                  type: 'relationship',
                  // @ts-expect-error not generated
                  relationTo: 'relation',
                },
                {
                  name: 'manyRelations',
                  type: 'relationship',
                  // @ts-expect-error not generated
                  relationTo: 'relation',
                  hasMany: true,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: 'posts-batches',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'content',
          type: 'blocks',
          blocks: [
            {
              slug: 'textBlock',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'content',
          type: 'blocks',
          blocks: [
            {
              slug: 'textBlock',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
                {
                  name: 'select',
                  type: 'select',
                  options: [
                    {
                      label: 'Option 1',
                      value: 'option1',
                    },
                    {
                      label: 'Option 2',
                      value: 'option2',
                    },
                  ],
                },
                {
                  name: 'relation',
                  type: 'relationship',
                  // @ts-expect-error not generated
                  relationTo: 'relation',
                },
                {
                  name: 'manyRelations',
                  type: 'relationship',
                  // @ts-expect-error not generated
                  relationTo: 'relation',
                  hasMany: true,
                },
              ],
            },
            {
              slug: 'block_second',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
              ],
            },
            {
              slug: 'block_third',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          name: 'localizedContent',
          type: 'blocks',
          localized: true,
          blocks: [
            {
              slug: 'textBlockLocalized',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  globals: [
    {
      slug: 'global-versioned',
      versions: {
        drafts: true,
      },
      fields: [
        {
          name: 'content',
          type: 'blocks',
          blocks: [
            {
              slug: 'textBlock',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: 'global',
      fields: [
        {
          name: 'content',
          type: 'blocks',
          blocks: [
            {
              slug: 'textBlock',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})
