import type { CollectionConfig, Field } from 'payload'

import type { AccessConfig } from '../../types/index.js'

type Props = {
  access: {
    adminOnly: NonNullable<AccessConfig['adminOnly']>
    publicAccess: NonNullable<AccessConfig['publicAccess']>
  }
  /**
   * Slug of the variant types collection, defaults to 'variantTypes'.
   */
  variantTypesSlug?: string
}

export const createVariantOptionsCollection: (props: Props) => CollectionConfig = (props) => {
  const {
    access: { adminOnly, publicAccess },
    variantTypesSlug = 'variantTypes',
  } = props || {}

  const fields: Field[] = [
    {
      name: 'variantType',
      type: 'relationship',
      admin: {
        readOnly: true,
      },
      relationTo: variantTypesSlug,
      required: true,
    },
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'value',
      type: 'text',
      admin: {
        description: 'should be defaulted or dynamic based on label',
      },
      required: true,
    },
  ]

  const baseConfig: CollectionConfig = {
    slug: 'variantOptions',
    access: {
      create: adminOnly,
      delete: adminOnly,
      read: publicAccess,
      update: adminOnly,
    },
    admin: {
      group: false,
      useAsTitle: 'label',
    },
    fields,
    labels: {
      plural: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:variantOptions'),
      singular: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:variantOption'),
    },
    trash: true,
  }

  return { ...baseConfig }
}
