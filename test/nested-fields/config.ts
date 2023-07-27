/* eslint-disable @typescript-eslint/ban-ts-comment */
import { buildConfigWithDefaults } from '../buildConfigWithDefaults';
import { devUser } from '../credentials';

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
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    });
  },
});
