import { admins } from '@/access/admins'
import { adminsOrPublished } from '@/access/adminsOrPublished'
import { CallToAction } from '@/blocks/CallToAction/config'
import { Content } from '@/blocks/Content/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { slugField } from '@/fields/slug'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { Field } from 'payload'

export const ProductsCollection: CollectionOverride = {
  access: {
    create: admins,
    delete: admins,
    read: adminsOrPublished,
    update: admins,
  },
  admin: {
    group: 'Ecommerce',
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
    priceInUSD: true,
    inventory: true,
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
      ...slugField('title', {
        slugOverrides: {
          required: true,
        },
      }),
    ]

    return fields
  },
}
