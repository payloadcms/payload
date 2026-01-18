import type { CollectionConfig, Field } from '@ruya.sa/payload'

import type { AccessConfig, CurrenciesConfig, InventoryConfig } from '../../../types/index.js'

import { inventoryField } from '../../../fields/inventoryField.js'
import { pricesField } from '../../../fields/pricesField.js'
import { variantsCollectionBeforeChange as beforeChange } from './hooks/beforeChange.js'
import { validateOptions } from './hooks/validateOptions.js'

type Props = {
  access: Pick<AccessConfig, 'adminOrPublishedStatus' | 'isAdmin'>
  currenciesConfig?: CurrenciesConfig
  /**
   * Enables inventory tracking for variants. Defaults to true.
   */
  inventory?: boolean | InventoryConfig
  /**
   * Slug of the products collection, defaults to 'products'.
   */
  productsSlug?: string
  /**
   * Slug of the variant options collection, defaults to 'variantOptions'.
   */
  variantOptionsSlug?: string
  /**
   * Slug of the variant types collection, defaults to 'variantTypes'.
   */
  variantTypesSlug?: string
}

export const createVariantsCollection: (props: Props) => CollectionConfig = (props) => {
  const {
    access,
    currenciesConfig,
    inventory = true,
    productsSlug = 'products',
    variantOptionsSlug = 'variantOptions',
    variantTypesSlug = 'variantTypes',
  } = props || {}
  const { supportedCurrencies } = currenciesConfig || {}

  const fields: Field[] = [
    {
      name: 'title',
      type: 'text',
      admin: {
        description:
          'Used for administrative purposes, not shown to customers. This is populated by default.',
      },
    },
    {
      name: 'product',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      relationTo: productsSlug,
      required: true,
    },
    {
      // This might need to be a custom component, to show a selector for each variant that is
      // enabled on the parent product
      // - separate select inputs, each showing only a specific variant (w/ options)
      // - it will save data to the DB as IDs in this relationship field
      // and needs a validate function as well which enforces that the options are fully specified, and accurate
      name: 'options',
      type: 'relationship',
      admin: {
        components: {
          Field: {
            path: '@ruya.sa/plugin-ecommerce/rsc#VariantOptionsSelector',
          },
        },
      },
      custom: {
        productsSlug,
        variantTypesSlug,
      },
      hasMany: true,
      label: 'Variant options',
      relationTo: variantOptionsSlug,
      required: true,
      validate: validateOptions({ productsCollectionSlug: productsSlug }),
    },
    ...(inventory ? [inventoryField()] : []),
  ]

  if (supportedCurrencies?.length && supportedCurrencies.length > 0) {
    const currencyOptions: string[] = []

    supportedCurrencies.forEach((currency) => {
      currencyOptions.push(currency.code)
    })

    if (currenciesConfig) {
      fields.push(...pricesField({ currenciesConfig }))
    }
  }

  const baseConfig: CollectionConfig = {
    slug: 'variants',
    access: {
      create: access.isAdmin,
      delete: access.isAdmin,
      read: access.adminOrPublishedStatus,
      update: access.isAdmin,
    },
    admin: {
      description: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:variantsCollectionDescription'),
      group: false,
      useAsTitle: 'title',
    },
    fields,
    hooks: {
      beforeChange: [beforeChange({ productsSlug, variantOptionsSlug })],
    },
    labels: {
      plural: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:variants'),
      singular: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:variant'),
    },
    trash: true,
    versions: {
      drafts: {
        autosave: true,
      },
    },
  }

  return baseConfig
}
