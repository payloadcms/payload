import type { Config } from 'payload/config'
import type { Field, GroupField, TabsField } from 'payload/dist/fields/config/types'

import { getMetaDescriptionField } from './fields/MetaDescription'
import { getMetaImageField } from './fields/MetaImage'
import { getMetaTitleField } from './fields/MetaTitle'
import type { PluginConfig } from './types'
import { Overview } from './ui/Overview'
import { getPreviewField } from './ui/Preview'

const seo =
  (pluginConfig: PluginConfig) =>
  (config: Config): Config => {
    const seoFields: GroupField[] = [
      {
        name: 'meta',
        label: 'SEO',
        type: 'group',
        fields: [
          {
            name: 'overview',
            label: 'Overview',
            type: 'ui',
            admin: {
              components: {
                Field: Overview,
              },
            },
          },
          {
            name: 'title',
            type: 'text',
            localized: true,
            admin: {
              components: {
                Field: props => getMetaTitleField({ ...props, pluginConfig }),
              },
            },
          },
          {
            name: 'description',
            type: 'textarea',
            localized: true,
            admin: {
              components: {
                Field: props => getMetaDescriptionField({ ...props, pluginConfig }),
              },
            },
          },
          ...(pluginConfig?.uploadsCollection
            ? [
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                {
                  name: 'image',
                  label: 'Meta Image',
                  type: 'upload',
                  localized: true,
                  relationTo: pluginConfig?.uploadsCollection,
                  admin: {
                    description:
                      'Maximum upload file size: 12MB. Recommended file size for images is <500KB.',
                    components: {
                      Field: props => getMetaImageField({ ...props, pluginConfig }),
                    },
                  },
                } as Field,
              ]
            : []),
          ...(pluginConfig?.fields || []),
          {
            name: 'preview',
            label: 'Preview',
            type: 'ui',
            admin: {
              components: {
                Field: props => getPreviewField({ ...props, pluginConfig }),
              },
            },
          },
        ],
      },
    ]

    return {
      ...config,
      collections:
        config.collections?.map(collection => {
          const { slug } = collection
          const isEnabled = pluginConfig?.collections?.includes(slug)

          if (isEnabled) {
            if (pluginConfig?.tabbedUI) {
              const seoTabs: TabsField[] = [
                {
                  type: 'tabs',
                  tabs: [
                    // append a new tab onto the end of the tabs array, if there is one at the first index
                    // if needed, create a new `Content` tab in the first index for this collection's base fields
                    ...(collection?.fields?.[0].type === 'tabs'
                      ? collection.fields[0]?.tabs
                      : [
                          {
                            label: collection?.labels?.singular || 'Content',
                            fields: [...(collection?.fields || [])],
                          },
                        ]),
                    {
                      label: 'SEO',
                      fields: seoFields,
                    },
                  ],
                },
              ]

              return {
                ...collection,
                fields: [
                  ...seoTabs,
                  ...(collection?.fields?.[0].type === 'tabs' ? collection?.fields?.slice(1) : []),
                ],
              }
            }

            return {
              ...collection,
              fields: seoFields,
            }
          }

          return collection
        }) || [],
      globals:
        config.globals?.map(global => {
          const { slug } = global
          const isEnabled = pluginConfig?.globals?.includes(slug)

          if (isEnabled) {
            if (pluginConfig?.tabbedUI) {
              const seoTabs: TabsField[] = [
                {
                  type: 'tabs',
                  tabs: [
                    // append a new tab onto the end of the tabs array, if there is one at the first index
                    // if needed, create a new `Content` tab in the first index for this collection's base fields
                    ...(global?.fields?.[0].type === 'tabs'
                      ? global.fields[0]?.tabs
                      : [
                          {
                            label: global?.label || 'Content',
                            fields: [...(global?.fields || [])],
                          },
                        ]),
                    {
                      label: 'SEO',
                      fields: seoFields,
                    },
                  ],
                },
              ]

              return {
                ...global,
                fields: [
                  ...seoTabs,
                  ...(global?.fields?.[0].type === 'tabs' ? global?.fields?.slice(1) : []),
                ],
              }
            }

            return {
              ...global,
              fields: [...(global?.fields || []), ...seoFields],
            }
          }

          return global
        }) || [],
    }
  }

export default seo
