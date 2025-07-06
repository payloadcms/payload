import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { Field, Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'
import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'

import { stripeAdapter } from '@payloadcms/plugin-ecommerce/payments/stripe'

import { Page, Product } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { admins } from '@/access/admins'
import { adminsOrPublished } from '@/access/adminsOrPublished'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { slugField } from '@/fields/slug'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { CallToAction } from '@/blocks/CallToAction/config'
import { Content } from '@/blocks/Content/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { anyone } from '@/access/anyone'

const generateTitle: GenerateTitle<Product | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Payload Ecommerce Template` : 'Payload Ecommerce Template'
}

const generateURL: GenerateURL<Product | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ['pages', 'products'],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  searchPlugin({
    collections: ['products'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
  ecommercePlugin({
    customers: {
      slug: 'users',
    },
    payments: {
      paymentMethods: [
        stripeAdapter({
          secretKey: process.env.STRIPE_SECRET_KEY!,
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
          webhookSecret: process.env.STRIPE_WEBHOOKS_SIGNING_SECRET!,
        }),
      ],
    },
    products: {
      variants: {
        variantsCollection: {
          versions: {
            drafts: {
              autosave: true,
            },
          },
          access: {
            create: admins,
            update: admins,
            delete: admins,
            read: adminsOrPublished,
          },
        },
        variantOptionsCollection: {
          access: {
            create: admins,
            update: admins,
            delete: admins,
            read: anyone,
          },
        },
        variantTypesCollection: {
          access: {
            create: admins,
            update: admins,
            delete: admins,
            read: anyone,
          },
        },
      },
      productsCollection: {
        access: {
          create: admins,
          delete: admins,
          read: adminsOrPublished,
          update: admins,
        },
        admin: {
          defaultColumns: ['title', 'enableVariants', '_status', 'variants.variants'],
          livePreview: {
            url: ({ data }) => {
              const path = generatePreviewPath({
                path: `/product/${typeof data?.slug === 'string' ? data.slug : ''}`,
              })
              return `${process.env.NEXT_PUBLIC_SERVER_URL}${path}`
            },
          },
          preview: (doc) =>
            generatePreviewPath({
              path: `/product/${typeof doc?.slug === 'string' ? doc.slug : ''}`,
            }),
          useAsTitle: 'title',
        },
        defaultPopulate: {
          title: true,
          slug: true,
          variantOptions: true,
          variants: true,
          enableVariants: true,
          gallery: true,
          price: true,
          stock: true,
          meta: true,
        },
        versions: {
          drafts: {
            autosave: true,
          },
        },
        fields: ({ defaultFields }) => {
          const fields: Field[] = [
            { name: 'title', type: 'text', required: true },
            {
              type: 'tabs',
              tabs: [
                {
                  fields: [
                    {
                      name: 'description',
                      type: 'richText',
                      editor: lexicalEditor({
                        features: ({ rootFeatures }) => {
                          return [
                            ...rootFeatures,
                            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                            FixedToolbarFeature(),
                            InlineToolbarFeature(),
                            HorizontalRuleFeature(),
                          ]
                        },
                      }),
                      label: false,
                      required: false,
                    },
                    {
                      name: 'gallery',
                      type: 'upload',
                      relationTo: 'media',
                      required: true,
                      hasMany: true,
                    },
                    {
                      name: 'layout',
                      type: 'blocks',
                      blocks: [CallToAction, Content, MediaBlock],
                    },
                  ],
                  label: 'Content',
                },
                {
                  fields: [
                    ...defaultFields,

                    {
                      name: 'relatedProducts',
                      type: 'relationship',
                      filterOptions: ({ id }) => {
                        return {
                          id: {
                            not_in: [id],
                          },
                        }
                      },
                      hasMany: true,
                      relationTo: 'products',
                    },
                  ],
                  label: 'Product Details',
                },
                {
                  name: 'meta',
                  label: 'SEO',
                  fields: [
                    OverviewField({
                      titlePath: 'meta.title',
                      descriptionPath: 'meta.description',
                      imagePath: 'meta.image',
                    }),
                    MetaTitleField({
                      hasGenerateFn: true,
                    }),
                    MetaImageField({
                      relationTo: 'media',
                    }),

                    MetaDescriptionField({}),
                    PreviewField({
                      // if the `generateUrl` function is configured
                      hasGenerateFn: true,

                      // field paths to match the target field for data
                      titlePath: 'meta.title',
                      descriptionPath: 'meta.description',
                    }),
                  ],
                },
              ],
            },
            {
              name: 'categories',
              type: 'relationship',
              admin: {
                position: 'sidebar',
                sortOptions: 'title',
              },
              hasMany: true,
              relationTo: 'categories',
            },
            slugField(),
          ]

          return fields
        },
      },
    },
  }),

  payloadCloudPlugin(),
]
