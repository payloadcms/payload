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
                  label: 'Collapsible',
                  type: 'collapsible',
                  fields: [
                    {
                      type: 'group',
                      name: 'group',
                      fields: [
                        {
                          type: 'tabs',
                          tabs: [
                            {
                              name: 'namedTab',
                              label: 'Named Tab',
                              fields: [
                                {
                                  type: 'tabs',
                                  tabs: [
                                    {
                                      label: 'Unnamed Tab',
                                      fields: [
                                        {
                                          name: 'blocks',
                                          type: 'blocks',
                                          blocks: [
                                            {
                                              slug: 'blockWithFields',
                                              fields: [
                                                {
                                                  type: 'text',
                                                  name: 'text',
                                                },
                                                {
                                                  type: 'array',
                                                  name: 'blockArray',
                                                  fields: [
                                                    {
                                                      type: 'text',
                                                      name: 'arrayText',
                                                    },
                                                  ],
                                                },
                                              ],
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
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
              label: 'Tab 1',
              name: 'tab1',
              fields: [
                {
                  type: 'blocks',
                  name: 'layout',
                  blocks: [
                    {
                      slug: 'block-1',
                      fields: [
                        {
                          type: 'array',
                          name: 'items',
                          fields: [
                            {
                              type: 'text',
                              name: 'title',
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
                          type: 'array',
                          name: 'items',
                          fields: [
                            {
                              type: 'text',
                              name: 'title2',
                              required: true,
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'blocks',
          name: 'blocksWithSimilarConfigs',
          blocks: [
            {
              slug: 'block-1',
              fields: [
                {
                  type: 'array',
                  name: 'items',
                  fields: [
                    {
                      type: 'text',
                      name: 'title',
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
                  type: 'array',
                  name: 'items',
                  fields: [
                    {
                      type: 'text',
                      name: 'title2',
                      required: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
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
