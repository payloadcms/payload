import type { CollectionConfig, Field } from 'payload'

import type { AccessConfig } from '../../types/index.js'

type Props = {
  access: Pick<AccessConfig, 'isAdmin' | 'publicAccess'>
  /**
   * Slug of the variant options collection, defaults to 'variantOptions'.
   */
  variantOptionsSlug?: string
}

export const createVariantTypesCollection: (props: Props) => CollectionConfig = (props) => {
  const { access, variantOptionsSlug = 'variantOptions' } = props || {}

  const fields: Field[] = [
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'options',
      type: 'join',
      collection: variantOptionsSlug,
      maxDepth: 2,
      on: 'variantType',
      orderable: true,
    },
  ]

  const baseConfig: CollectionConfig = {
    slug: 'variantTypes',
    access: {
      create: access.isAdmin,
      delete: access.isAdmin,
      read: access.publicAccess,
      update: access.isAdmin,
    },
    admin: {
      group: false,
      useAsTitle: 'label',
    },
    fields,
    labels: {
      plural: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:variantTypes'),
      singular: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:variantType'),
    },
    trash: true,
  }

  return { ...baseConfig }
}
