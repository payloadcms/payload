import type { CollectionConfig, Field } from 'payload'

import type { AccessConfig, CurrenciesConfig, InventoryConfig } from '../../../types/index.js'

import { inventoryField } from '../../../fields/inventoryField.js'
import { pricesField } from '../../../fields/pricesField.js'
import { variantsCollectionBeforeChange as beforeChange } from './hooks/beforeChange.js'
import { validateOptions } from './hooks/validateOptions.js'

type Props = {
  access: {
    adminOnly: NonNullable<AccessConfig['adminOnly']>
    adminOrPublishedStatus: NonNullable<AccessConfig['adminOrPublishedStatus']>
  }
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
}

export const createVariantsCollection: (props: Props) => CollectionConfig = (props) => {
  const {
    access: { adminOnly, adminOrPublishedStatus },
    currenciesConfig,
    inventory = true,
    productsSlug = 'products',
    variantOptionsSlug = 'variantOptions',
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
            path: '@payloadcms/plugin-ecommerce/rsc#VariantOptionsSelector',
          },
        },
      },
      hasMany: true,
      label: 'Variant options',
      relationTo: variantOptionsSlug,
      required: true,
      validate: validateOptions(),
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
      create: adminOnly,
      delete: adminOnly,
      read: adminOrPublishedStatus,
      update: adminOnly,
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
