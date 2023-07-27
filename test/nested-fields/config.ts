/* eslint-disable @typescript-eslint/ban-ts-comment */
import { buildConfigWithDefaults } from '../buildConfigWithDefaults';

// fields with fields
// - array -> fields
// - blocks -> blocks
// - row -> fields
// - collapsible -> fields
// - group -> fields
// - tabs -> tab -> fields
// - tabs -> named-tab -> fields

export default buildConfigWithDefaults({
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
      ],
    },
    {
      slug: 'blocks-collection',
      fields: [
        {
          name: 'layout',
          type: 'blocks',
          blocks: [
            {
              slug: 'content',
              fields: [
                {
                  name: 'richText',
                  type: 'richText',
                },
                {
                  name: 'field1',
                  type: 'text',
                },
                {
                  name: 'field2',
                  type: 'text',
                },
                {
                  name: 'field3',
                  type: 'text',
                },
                {
                  name: 'field4',
                  type: 'text',
                },
                {
                  name: 'field5',
                  type: 'text',
                },
                {
                  name: 'field6',
                  type: 'text',
                },
                {
                  name: 'field7',
                  type: 'text',
                },
                {
                  name: 'field8',
                  type: 'text',
                },
                {
                  name: 'field9',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});
