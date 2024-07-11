import type { CollectionConfig } from 'payload'

import { generatePreviewPath } from '@/payload/utilities/generatePreviewPath'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import type { ProductVariant } from './ui/types'

import { admins } from '../../access/admins'
import { CallToAction } from '../../blocks/CallToAction'
import { Content } from '../../blocks/Content'
import { MediaBlock } from '../../blocks/MediaBlock'
import { slugField } from '../../fields/slug'
import { adminsOrPublished } from './access/adminsOrPublished'
import { beforeProductChange } from './hooks/beforeChange'
import { deleteProductFromCarts } from './hooks/deleteProductFromCarts'
import { revalidateProduct } from './hooks/revalidateProduct'
import { KeyLabel } from './ui/RowLabels/KeyLabel'
import { OptionLabel } from './ui/RowLabels/OptionLabel'
import { VariantLabel } from './ui/RowLabels/VariantLabel'
import { StripeProductSelect } from './ui/StripeProductSelect'
import { VariantSelect } from './ui/VariantSelect'

export const Products: CollectionConfig = {
  slug: 'products',
  access: {
    create: admins,
    delete: admins,
    read: adminsOrPublished,
    update: admins,
  },
  admin: {
    defaultColumns: ['title', 'stripeProductID', '_status'],
    livePreview: {
      url: ({ data }) => {
        const path = generatePreviewPath({
          path: `/product/${typeof data?.slug === 'string' ? data.slug : ''}`,
        })
        return `${process.env.NEXT_PUBLIC_SERVER_URL}${path}`
      },
    },
    preview: (doc) =>
      generatePreviewPath({ path: `/product/${typeof doc?.slug === 'string' ? doc.slug : ''}` }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'publishedOn',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
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
              type: 'array',
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
              ],
              labels: {
                plural: 'Images',
                singular: 'Image',
              },
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
            {
              name: 'enableVariants',
              type: 'checkbox',
            },
            {
              name: 'variants',
              type: 'group',
              admin: {
                condition: (data, siblingData) => Boolean(siblingData.enableVariants),
              },
              fields: [
                {
                  name: 'options',
                  type: 'array',
                  admin: {
                    components: {
                      RowLabel: KeyLabel,
                    },
                    initCollapsed: true,
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'label',
                          type: 'text',
                          required: true,
                        },
                        {
                          name: 'slug',
                          type: 'text',
                          required: true,
                        },
                      ],
                    },
                    {
                      name: 'values',
                      type: 'array',
                      admin: {
                        components: {
                          RowLabel: OptionLabel,
                        },
                        initCollapsed: true,
                      },
                      fields: [
                        {
                          type: 'row',
                          fields: [
                            {
                              name: 'label',
                              type: 'text',
                              required: true,
                            },
                            {
                              name: 'slug',
                              type: 'text',
                              required: true,
                            },
                          ],
                        },
                      ],
                    },
                  ],
                  label: 'Variant options',
                  minRows: 1,
                },
                {
                  name: 'variants',
                  type: 'array',
                  admin: {
                    components: {
                      RowLabel: VariantLabel,
                    },
                    condition: (data, siblingData) => {
                      return Boolean(siblingData?.options?.length)
                    },
                  },
                  fields: [
                    {
                      name: 'options',
                      type: 'text',
                      admin: {
                        components: {
                          Field: VariantSelect,
                        },
                      },
                      hasMany: true,
                      required: true,
                    },
                    {
                      name: 'stripeProductID',
                      type: 'text',
                      admin: {
                        components: {
                          Field: StripeProductSelect,
                        },
                      },
                      label: 'Stripe Product ID',
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'stock',
                          type: 'number',
                          admin: {
                            description:
                              'Define stock for this variant. A stock of 0 disables checkout for this variant.',
                            width: '50%',
                          },
                          defaultValue: 0,
                          required: true,
                        },
                      ],
                    },
                    {
                      name: 'info',
                      type: 'json',
                      admin: {
                        hidden: true,
                        readOnly: true,
                      },
                    },
                    {
                      name: 'images',
                      type: 'array',
                      fields: [
                        {
                          name: 'image',
                          type: 'upload',
                          relationTo: 'media',
                        },
                      ],
                    },
                  ],
                  labels: {
                    plural: 'Variants',
                    singular: 'Variant',
                  },
                  minRows: 1,
                  validate: (value, { siblingData }) => {
                    if (siblingData.variants.length) {
                      const hasDuplicate = siblingData.variants.some(
                        (variant: ProductVariant, index) => {
                          // Check this against other variants
                          const dedupedArray = [...siblingData.variants].filter(
                            (_, i) => i !== index,
                          )

                          // Join the arrays then compare the strings, note that we sort the array before it's saved in the custom component
                          const test = dedupedArray.find((otherOption: ProductVariant) => {
                            const firstOption = otherOption?.options?.join('')
                            const secondOption = variant?.options?.join('')

                            return firstOption === secondOption
                          })

                          return Boolean(test)
                        },
                      )

                      if (hasDuplicate) {
                        return 'There is a duplicate variant'
                      }
                    }

                    return true
                  },
                },
              ],
              label: false,
            },
            {
              name: 'stripeProductID',
              type: 'text',
              admin: {
                components: {
                  Field: StripeProductSelect,
                },
                condition: (data) => !data.enableVariants,
              },
              label: 'Stripe Product',
            },
            {
              name: 'info',
              type: 'json',
              admin: {
                condition: (data) => !data.enableVariants,
                hidden: true,
              },
            },
            {
              name: 'stock',
              type: 'number',
              admin: {
                condition: (data) => !data.enableVariants,
                description:
                  'Define stock for this product. A stock of 0 disables checkout for this product.',
              },
              defaultValue: 0,
              required: true,
            },
            {
              name: 'price',
              type: 'number',
              admin: {
                hidden: true,
              },
            },
            {
              name: 'currency',
              type: 'text',
              admin: {
                hidden: true,
              },
            },
          ],
          label: 'Product Details',
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
    slugField(),
    {
      name: 'skipSync',
      type: 'checkbox',
      admin: {
        hidden: true,
        position: 'sidebar',
        readOnly: true,
      },
      label: 'Skip Sync',
    },
  ],
  hooks: {
    afterChange: [revalidateProduct],
    afterDelete: [deleteProductFromCarts],
    beforeChange: [beforeProductChange],
  },
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 50,
  },
}
