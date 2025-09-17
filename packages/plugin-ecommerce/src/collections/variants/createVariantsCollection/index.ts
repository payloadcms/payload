import type { CollectionConfig, Field } from 'payload'

import type {
  AccessConfig,
  CollectionOverride,
  CurrenciesConfig,
  InventoryConfig,
} from '../../../types.js'

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
  inventory?: InventoryConfig
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

  const defaultFields: Field[] = [
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
        description:
          'this should not be editable, or at least, should be able to be pre-filled via default',
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
      defaultFields.push(...pricesField({ currenciesConfig }))
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
      group: 'Ecommerce',
      useAsTitle: 'title',
    },
    fields: defaultFields,
    hooks: {
      beforeChange: [beforeChange({ productsSlug, variantOptionsSlug })],
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
