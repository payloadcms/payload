import type { CollectionConfig, Field } from 'payload'

import type { AccessConfig, CountryType } from '../../types/index.js'

import { defaultCountries } from './defaultCountries.js'
import { beforeChange } from './hooks/beforeChange.js'

type Props = {
  access: {
    adminOrCustomerOwner: AccessConfig['adminOrCustomerOwner']
    authenticatedOnly: NonNullable<AccessConfig['authenticatedOnly']>
    customerOnlyFieldAccess: AccessConfig['customerOnlyFieldAccess']
  }
  /**
   * Array of fields used for capturing the address data. Use this over overrides to customise the fields here as it's reused across the plugin.
   */
  addressFields: Field[]
  /**
   * Slug of the customers collection, defaults to 'users'.
   */
  customersSlug?: string
  supportedCountries?: CountryType[]
}

export const createAddressesCollection: (props: Props) => CollectionConfig = (props) => {
  const {
    access: { adminOrCustomerOwner, authenticatedOnly, customerOnlyFieldAccess },
    addressFields,
    customersSlug = 'users',
  } = props || {}

  const { supportedCountries: supportedCountriesFromProps } = props || {}
  const supportedCountries = supportedCountriesFromProps || defaultCountries
  const hasOnlyOneCountry = supportedCountries && supportedCountries.length === 1

  const fields: Field[] = [
    {
      name: 'customer',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:customer'),
      relationTo: customersSlug,
    },
    ...addressFields.map((field) => {
      if ('name' in field && field.name === 'country') {
        return {
          name: 'country',
          type: 'select',
          label: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-ecommerce:addressCountry'),
          options: supportedCountries || defaultCountries,
          required: true,
          ...(supportedCountries && supportedCountries?.[0] && hasOnlyOneCountry
            ? {
                defaultValue: supportedCountries?.[0].value,
              }
            : {}),
        } as Field
      }

      return field
    }),
  ]

  const baseConfig: CollectionConfig = {
    slug: 'addresses',
    access: {
      create: authenticatedOnly,
      delete: adminOrCustomerOwner,
      read: adminOrCustomerOwner,
      update: adminOrCustomerOwner,
    },
    admin: {
      description: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressesCollectionDescription'),
      group: 'Ecommerce',
      hidden: true,
      useAsTitle: 'createdAt',
    },
    fields,
    hooks: {
      beforeChange: [beforeChange({ customerOnlyFieldAccess })],
    },
    labels: {
      plural: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addresses'),
      singular: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:address'),
    },
    timestamps: true,
  }

  return { ...baseConfig }
}
