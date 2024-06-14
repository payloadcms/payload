import type { Config, Field, GroupField, TabsField, TextField } from 'payload'

import { addDataAndFileToRequest } from '@payloadcms/next/utilities'
import { withMergedProps } from '@payloadcms/ui/elements/withMergedProps'
import { deepMerge } from 'payload/shared'

import type {
  GenerateDescription,
  GenerateImage,
  GenerateTitle,
  GenerateURL,
  SEOPluginConfig,
} from './types.js'

import { MetaDescription } from './fields/MetaDescription.js'
import { MetaImage } from './fields/MetaImage.js'
import { MetaTitle } from './fields/MetaTitle.js'
import { translations } from './translations/index.js'
import { Overview } from './ui/Overview.js'
import { Preview } from './ui/Preview.js'

export const seoPlugin =
  (pluginConfig: SEOPluginConfig) =>
  (config: Config): Config => {
    const seoFields: GroupField[] = [
      {
        name: 'meta',
        type: 'group',
        fields: [
          {
            name: 'overview',
            type: 'ui',
            admin: {
              components: {
                Field: Overview,
              },
            },
            label: 'Overview',
          },
          {
            name: 'title',
            type: 'text',
            admin: {
              components: {
                Field: withMergedProps({
                  Component: MetaTitle,
                  sanitizeServerOnlyProps: true,
                  toMergeIntoProps: {
                    hasGenerateTitleFn: typeof pluginConfig?.generateTitle === 'function',
                  },
                }),
              },
            },
            localized: true,
            ...((pluginConfig?.fieldOverrides?.title as unknown as TextField) ?? {}),
          },
          {
            name: 'description',
            type: 'textarea',
            admin: {
              components: {
                Field: withMergedProps({
                  Component: MetaDescription,
                  sanitizeServerOnlyProps: true,
                  toMergeIntoProps: {
                    hasGenerateDescriptionFn:
                      typeof pluginConfig?.generateDescription === 'function',
                  },
                }),
              },
            },
            localized: true,
            ...(pluginConfig?.fieldOverrides?.description ?? {}),
          },
          ...(pluginConfig?.uploadsCollection
            ? [
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                {
                  name: 'image',
                  type: 'upload',
                  admin: {
                    components: {
                      Field: withMergedProps({
                        Component: MetaImage,
                        sanitizeServerOnlyProps: true,
                        toMergeIntoProps: {
                          hasGenerateImageFn: typeof pluginConfig?.generateImage === 'function',
                        },
                      }),
                    },
                    description:
                      'Maximum upload file size: 12MB. Recommended file size for images is <500KB.',
                  },
                  label: 'Meta Image',
                  localized: true,
                  relationTo: pluginConfig?.uploadsCollection,
                  ...(pluginConfig?.fieldOverrides?.image ?? {}),
                } as Field,
              ]
            : []),
          ...(pluginConfig?.fields || []),
          {
            name: 'preview',
            type: 'ui',
            admin: {
              components: {
                Field: withMergedProps({
                  Component: Preview,
                  sanitizeServerOnlyProps: true,
                  toMergeIntoProps: {
                    hasGenerateURLFn: typeof pluginConfig?.generateURL === 'function',
                  },
                }),
              },
            },
            label: 'Preview',
          },
        ],
        interfaceName: pluginConfig.interfaceName,
        label: 'SEO',
      },
    ]

    return {
      ...config,
      collections:
        config.collections?.map((collection) => {
          const { slug } = collection
          const isEnabled = pluginConfig?.collections?.includes(slug)

          if (isEnabled) {
            if (pluginConfig?.tabbedUI) {
              // prevent issues with auth enabled collections having an email field that shouldn't be moved to the SEO tab
              const emailField =
                (collection.auth ||
                  !(typeof collection.auth === 'object' && collection.auth.disableLocalStrategy)) &&
                collection.fields?.find((field) => 'name' in field && field.name === 'email')
              const hasOnlyEmailField = collection.fields?.length === 1 && emailField

              const seoTabs: TabsField[] = hasOnlyEmailField
                ? [
                    {
                      type: 'tabs',
                      tabs: [
                        {
                          fields: seoFields,
                          label: 'SEO',
                        },
                      ],
                    },
                  ]
                : [
                    {
                      type: 'tabs',
                      tabs: [
                        // append a new tab onto the end of the tabs array, if there is one at the first index
                        // if needed, create a new `Content` tab in the first index for this collection's base fields
                        ...(collection?.fields?.[0]?.type === 'tabs' &&
                        collection?.fields?.[0]?.tabs
                          ? collection.fields[0].tabs
                          : [
                              {
                                fields: [
                                  ...(emailField
                                    ? collection.fields.filter(
                                        (field) => 'name' in field && field.name !== 'email',
                                      )
                                    : collection.fields),
                                ],
                                label: collection?.labels?.singular || 'Content',
                              },
                            ]),
                        {
                          fields: seoFields,
                          label: 'SEO',
                        },
                      ],
                    },
                  ]

              return {
                ...collection,
                fields: [
                  ...(emailField ? [emailField] : []),
                  ...seoTabs,
                  ...(collection?.fields?.[0]?.type === 'tabs' ? collection.fields.slice(1) : []),
                ],
              }
            }

            return {
              ...collection,
              fields: [...(collection?.fields || []), ...seoFields],
            }
          }

          return collection
        }) || [],
      endpoints: [
        ...(config.endpoints ?? []),
        {
          handler: async (req) => {
            const reqWithData = await addDataAndFileToRequest({ request: req })
            const args: Parameters<GenerateTitle>[0] =
              reqWithData.data as unknown as Parameters<GenerateTitle>[0]
            const result = pluginConfig.generateTitle ? await pluginConfig.generateTitle(args) : ''
            return new Response(JSON.stringify({ result }), { status: 200 })
          },
          method: 'post',
          path: '/plugin-seo/generate-title',
        },
        {
          handler: async (req) => {
            const reqWithData = await addDataAndFileToRequest({ request: req })
            const args: Parameters<GenerateDescription>[0] =
              reqWithData.data as unknown as Parameters<GenerateDescription>[0]
            const result = pluginConfig.generateDescription
              ? await pluginConfig.generateDescription(args)
              : ''
            return new Response(JSON.stringify({ result }), { status: 200 })
          },
          method: 'post',
          path: '/plugin-seo/generate-description',
        },
        {
          handler: async (req) => {
            const reqWithData = await addDataAndFileToRequest({ request: req })
            const args: Parameters<GenerateURL>[0] =
              reqWithData.data as unknown as Parameters<GenerateURL>[0]
            const result = pluginConfig.generateURL ? await pluginConfig.generateURL(args) : ''
            return new Response(JSON.stringify({ result }), { status: 200 })
          },
          method: 'post',
          path: '/plugin-seo/generate-url',
        },
        {
          handler: async (req) => {
            const reqWithData = await addDataAndFileToRequest({ request: req })
            const args: Parameters<GenerateImage>[0] =
              reqWithData.data as unknown as Parameters<GenerateImage>[0]
            const result = pluginConfig.generateImage ? await pluginConfig.generateImage(args) : ''
            return new Response(result, { status: 200 })
          },
          method: 'post',
          path: '/plugin-seo/generate-image',
        },
      ],
      globals:
        config.globals?.map((global) => {
          const { slug } = global
          const isEnabled = pluginConfig?.globals?.includes(slug)

          if (isEnabled) {
            if (pluginConfig?.tabbedUI) {
              const seoTabs: TabsField[] = [
                {
                  type: 'tabs',
                  tabs: [
                    // append a new tab onto the end of the tabs array, if there is one at the first index
                    // if needed, create a new `Content` tab in the first index for this global's base fields
                    ...(global?.fields?.[0].type === 'tabs' && global?.fields?.[0].tabs
                      ? global.fields[0].tabs
                      : [
                          {
                            fields: [...(global?.fields || [])],
                            label: global?.label || 'Content',
                          },
                        ]),
                    {
                      fields: seoFields,
                      label: 'SEO',
                    },
                  ],
                },
              ]

              return {
                ...global,
                fields: [
                  ...seoTabs,
                  ...(global?.fields?.[0].type === 'tabs' ? global.fields.slice(1) : []),
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
      i18n: {
        ...config.i18n,
        translations: {
          ...deepMerge(translations, config.i18n?.translations),
        },
      },
    }
  }
