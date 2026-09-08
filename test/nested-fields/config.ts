import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

// fields with fields
// - array -> fields
// - blocks -> blocks
// - row -> fields
// - collapsible -> fields
// - group -> fields
// - tabs -> tab -> fields
// - tabs -> named-tab -> fields

export default buildConfigWithDefaults({
  suite: 'nested-fields',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      {
        slug: 'nested-fields',
        fields: [
          {
            name: 'array',
            type: 'array',
            fields: [
              {
                type: 'row',
                fields: [
                  {
                    type: 'collapsible',
                    fields: [
                      {
                        name: 'group',
                        type: 'group',
                        fields: [
                          {
                            type: 'tabs',
                            tabs: [
                              {
                                name: 'namedTab',
                                fields: [
                                  {
                                    type: 'tabs',
                                    tabs: [
                                      {
                                        fields: [
                                          {
                                            name: 'blocks',
                                            type: 'blocks',
                                            blocks: [
                                              {
                                                slug: 'blockWithFields',
                                                fields: [
                                                  {
                                                    name: 'text',
                                                    type: 'text',
                                                  },
                                                  {
                                                    name: 'blockArray',
                                                    type: 'array',
                                                    fields: [
                                                      {
                                                        name: 'arrayText',
                                                        type: 'text',
                                                      },
                                                    ],
                                                  },
                                                ],
                                              },
                                            ],
                                          },
                                        ],
                                        label: 'Unnamed Tab',
                                      },
                                    ],
                                  },
                                ],
                                label: 'Named Tab',
                              },
                            ],
                          },
                        ],
                      },
                    ],
                    label: 'Collapsible',
                  },
                ],
              },
            ],
          },

          {
            type: 'tabs',
            label: 'Tabs',
            tabs: [
              {
                name: 'tab1',
                fields: [
                  {
                    name: 'layout',
                    type: 'blocks',
                    blocks: [
                      {
                        slug: 'block-1',
                        fields: [
                          {
                            name: 'items',
                            type: 'array',
                            fields: [
                              {
                                name: 'title',
                                type: 'text',
                                required: true,
                              },
                            ],
                          },
                        ],
                      },
                      {
                        slug: 'block-2',
                        fields: [
                          {
                            name: 'items',
                            type: 'array',
                            fields: [
                              {
                                name: 'title2',
                                type: 'text',
                                required: true,
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
                label: 'Tab 1',
              },
            ],
          },
          {
            name: 'blocksWithSimilarConfigs',
            type: 'blocks',
            blocks: [
              {
                slug: 'block-1',
                fields: [
                  {
                    name: 'items',
                    type: 'array',
                    fields: [
                      {
                        name: 'title',
                        type: 'text',
                        required: true,
                      },
                    ],
                  },
                ],
              },
              {
                slug: 'block-2',
                fields: [
                  {
                    name: 'items',
                    type: 'array',
                    fields: [
                      {
                        name: 'title2',
                        type: 'text',
                        required: true,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        versions: false,
      },
    ],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
})
