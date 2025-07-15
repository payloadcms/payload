import type { CollectionConfig, Field } from 'payload'

import type { FieldsOverride } from '../types.js'

type Props = {
  /**
   * Slug of the customers collection, defaults to 'users'.
   */
  customersSlug?: string
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}

export const addressesCollection: (props?: Props) => CollectionConfig = (props) => {
  const { customersSlug = 'users', overrides } = props || {}
  const fieldsOverride = overrides?.fields

  const defaultFields: Field[] = [
    {
      name: 'customer',
      type: 'relationship',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:customer'),
      relationTo: customersSlug,
    },
    {
      name: 'title',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressTitle'),
      required: true,
    },
    {
      name: 'firstName',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressFirstName'),
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressLastName'),
      required: true,
    },
    {
      name: 'company',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressCompany'),
    },
    {
      name: 'addressLine1',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressLine1'),
      required: true,
    },
    {
      name: 'addressLine2',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressLine2'),
    },
    {
      name: 'city',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressCity'),
      required: true,
    },
    {
      name: 'state',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressState'),
    },
    {
      name: 'postalCode',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressPostalCode'),
    },
    {
      name: 'country',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressCountry'),
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressPhone'),
    },
  ]

  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields })
      : defaultFields

  const baseConfig: CollectionConfig = {
    slug: 'addresses',
    timestamps: true,
    ...overrides,
    admin: {
      useAsTitle: 'createdAt',
      ...overrides?.admin,
    },
    fields,
  }

  return { ...baseConfig }
}
