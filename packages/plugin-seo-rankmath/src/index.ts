/**
 * RankMath-style SEO Plugin for Payload CMS
 */

import type { Config, Field, GroupField, TabsField } from 'payload'
import { deepMergeSimple } from 'payload/shared'

import type { RankMathPluginConfig } from './types.js'
import { analyzeSEO } from './analysis/index.js'
import { autoGenerateSchema } from './schema/index.js'
import { generateSitemap } from './sitemap/index.js'
import { defaults } from './defaults.js'

export * from './types.js'
export * from './analysis/index.js'
export * from './schema/index.js'
export * from './sitemap/index.js'

export const seoRankMathPlugin =
  (pluginConfig: RankMathPluginConfig) =>
  (config: Config): Config => {
    // Merge default weights with user config
    const scoringWeights = {
      ...defaults.scoring,
      ...pluginConfig.scoring,
    }

    // Create SEO fields
    const seoFields = createSEOFields(pluginConfig)

    // Wrap in group or tabs based on config
    const fieldContainer: GroupField[] = [
      {
        name: 'seoRankMath',
        type: 'group',
        label: 'SEO (RankMath)',
        fields: [
          ...(pluginConfig?.fields && typeof pluginConfig.fields === 'function'
            ? pluginConfig.fields({ defaultFields: seoFields })
            : seoFields),
        ],
        interfaceName: pluginConfig.interfaceName || 'SEORankMath',
      },
    ]

    // Add collections
    const modifiedCollections = config.collections?.map((collection) => {
      const { slug } = collection
      const isEnabled = pluginConfig?.collections?.includes(slug)

      if (isEnabled) {
        if (pluginConfig?.tabbedUI) {
          const emailField =
            collection.auth &&
            !(typeof collection.auth === 'object' && collection.auth.disableLocalStrategy) &&
            collection.fields?.find((field) => 'name' in field && field.name === 'email')
          const hasOnlyEmailField = collection.fields?.length === 1 && emailField

          const seoTabs: TabsField[] = hasOnlyEmailField
            ? [
                {
                  type: 'tabs',
                  tabs: [
                    {
                      fields: fieldContainer,
                      label: 'SEO',
                    },
                  ],
                },
              ]
            : [
                {
                  type: 'tabs',
                  tabs: [
                    ...(collection?.fields?.[0]?.type === 'tabs' && collection?.fields?.[0]?.tabs
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
                      fields: fieldContainer,
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
          fields: [...(collection?.fields || []), ...fieldContainer],
        }
      }

      return collection
    })

    // Add globals
    const modifiedGlobals = config.globals?.map((global) => {
      const { slug } = global
      const isEnabled = pluginConfig?.globals?.includes(slug)

      if (isEnabled) {
        if (pluginConfig?.tabbedUI) {
          const seoTabs: TabsField[] = [
            {
              type: 'tabs',
              tabs: [
                ...(global?.fields?.[0]?.type === 'tabs' && global?.fields?.[0].tabs
                  ? global.fields[0].tabs
                  : [
                      {
                        fields: [...(global?.fields || [])],
                        label: global?.label || 'Content',
                      },
                    ]),
                {
                  fields: fieldContainer,
                  label: 'SEO',
                },
              ],
            },
          ]

          return {
            ...global,
            fields: [
              ...seoTabs,
              ...(global?.fields?.[0]?.type === 'tabs' ? global.fields.slice(1) : []),
            ],
          }
        }

        return {
          ...global,
          fields: [...(global?.fields || []), ...fieldContainer],
        }
      }

      return global
    })

    // Create API endpoints
    const endpoints = [
      ...(config.endpoints ?? []),

      // SEO Analysis endpoint
      {
        path: '/plugin-seo-rankmath/analyze',
        method: 'post' as const,
        handler: async (req) => {
          try {
            const data = await req.json?.()

            if (!data) {
              return new Response(JSON.stringify({ error: 'No data provided' }), { status: 400 })
            }

            const analysis = analyzeSEO(data, scoringWeights)

            return new Response(
              JSON.stringify({
                success: true,
                analysis,
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          } catch (error) {
            return new Response(
              JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              }),
              { status: 500 },
            )
          }
        },
      },

      // Sitemap endpoint
      ...(pluginConfig.sitemap?.enabled
        ? [
            {
              path: '/sitemap.xml',
              method: 'get' as const,
              handler: async (req) => {
                try {
                  const xml = await generateSitemap(req.payload, pluginConfig.sitemap!)

                  return new Response(xml, {
                    status: 200,
                    headers: { 'Content-Type': 'application/xml' },
                  })
                } catch (error) {
                  return new Response('Error generating sitemap', { status: 500 })
                }
              },
            },
          ]
        : []),
    ]

    return {
      ...config,
      collections: modifiedCollections || [],
      globals: modifiedGlobals || [],
      endpoints,
    }
  }

/**
 * Create SEO fields based on plugin configuration
 */
function createSEOFields(config: RankMathPluginConfig): Field[] {
  const fields: Field[] = []

  // Focus Keyword
  if (config.focusKeywordEnabled !== false) {
    fields.push({
      name: 'focusKeyword',
      type: 'text',
      label: 'Focus Keyword',
      admin: {
        description:
          'Enter the main keyword you want to rank for. This will be used to analyze your content.',
      },
    })
  }

  // SEO Score (read-only, calculated)
  if (config.showScore !== false) {
    fields.push({
      name: 'seoScore',
      type: 'number',
      label: 'SEO Score',
      admin: {
        readOnly: true,
        description: 'Overall SEO score (0-100). Higher is better.',
      },
      defaultValue: 0,
    })
  }

  // Meta Title
  fields.push({
    name: 'metaTitle',
    type: 'text',
    label: 'Meta Title',
    admin: {
      description: `Recommended: ${defaults.title.minLength}-${defaults.title.maxLength} characters`,
    },
    maxLength: 100,
  })

  // Meta Description
  fields.push({
    name: 'metaDescription',
    type: 'textarea',
    label: 'Meta Description',
    admin: {
      description: `Recommended: ${defaults.description.minLength}-${defaults.description.maxLength} characters`,
    },
    maxLength: 200,
  })

  // Canonical URL
  fields.push({
    name: 'canonicalURL',
    type: 'text',
    label: 'Canonical URL',
    admin: {
      description: 'The canonical URL for this page to avoid duplicate content issues',
    },
  })

  // Schema Markup
  if (config.schemaEnabled !== false) {
    fields.push({
      name: 'schemaType',
      type: 'select',
      label: 'Schema Type',
      options: [
        { label: 'Article', value: 'Article' },
        { label: 'Blog Posting', value: 'BlogPosting' },
        { label: 'News Article', value: 'NewsArticle' },
        { label: 'WebPage', value: 'WebPage' },
        { label: 'Product', value: 'Product' },
        { label: 'Organization', value: 'Organization' },
        { label: 'Person', value: 'Person' },
        { label: 'FAQ Page', value: 'FAQPage' },
        { label: 'Event', value: 'Event' },
        { label: 'Recipe', value: 'Recipe' },
      ],
      defaultValue: config.defaultSchemaType || 'WebPage',
      admin: {
        description: 'Select the schema type that best describes this content',
      },
    })

    fields.push({
      name: 'schemaMarkup',
      type: 'json',
      label: 'Schema Markup (JSON-LD)',
      admin: {
        description: 'Custom schema.org structured data in JSON-LD format',
      },
    })
  }

  // Open Graph
  if (config.openGraph?.enabled !== false) {
    fields.push({
      type: 'collapsible',
      label: 'Open Graph / Social Media',
      fields: [
        {
          name: 'ogTitle',
          type: 'text',
          label: 'OG Title',
          admin: {
            description: 'Title for social media sharing (Facebook, LinkedIn, etc.)',
          },
        },
        {
          name: 'ogDescription',
          type: 'textarea',
          label: 'OG Description',
          admin: {
            description: 'Description for social media sharing',
          },
        },
        ...(config.uploadsCollection
          ? [
              {
                name: 'ogImage',
                type: 'upload' as const,
                label: 'OG Image',
                relationTo: config.uploadsCollection,
                admin: {
                  description: 'Image for social media sharing (recommended: 1200x630px)',
                },
              },
            ]
          : []),
      ],
    })
  }

  // Twitter Card
  if (config.twitterCard?.enabled !== false) {
    fields.push({
      type: 'collapsible',
      label: 'Twitter Card',
      fields: [
        {
          name: 'twitterTitle',
          type: 'text',
          label: 'Twitter Title',
        },
        {
          name: 'twitterDescription',
          type: 'textarea',
          label: 'Twitter Description',
        },
        {
          name: 'twitterCardType',
          type: 'select',
          label: 'Card Type',
          options: [
            { label: 'Summary', value: 'summary' },
            { label: 'Summary Large Image', value: 'summary_large_image' },
          ],
          defaultValue: config.twitterCard?.cardType || 'summary_large_image',
        },
        ...(config.uploadsCollection
          ? [
              {
                name: 'twitterImage',
                type: 'upload' as const,
                label: 'Twitter Image',
                relationTo: config.uploadsCollection,
              },
            ]
          : []),
      ],
    })
  }

  // Analysis Results (read-only)
  if (config.showAnalysis !== false) {
    fields.push({
      name: 'seoAnalysis',
      type: 'json',
      label: 'SEO Analysis',
      admin: {
        readOnly: true,
        description: 'Detailed SEO analysis results',
      },
    })
  }

  return fields
}
