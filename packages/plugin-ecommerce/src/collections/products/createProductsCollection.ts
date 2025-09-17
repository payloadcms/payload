import type { CollectionConfig } from 'payload'

import type { AccessConfig, CurrenciesConfig, InventoryConfig } from '../../types.js'

import { inventoryField } from '../../fields/inventoryField.js'
import { pricesField } from '../../fields/pricesField.js'
import { variantsFields } from '../../fields/variantsFields.js'

type Props = {
  access: {
    adminOnly: NonNullable<AccessConfig['adminOnly']>
    adminOrPublishedStatus: NonNullable<AccessConfig['adminOrPublishedStatus']>
  }
  currenciesConfig: CurrenciesConfig
  enableVariants?: boolean
  /**
   * Adds in an inventory field to the product and its variants. This is useful for tracking inventory levels.
   * Defaults to true.
   */
  inventory?: boolean | InventoryConfig
  /**
   * Slug of the variants collection, defaults to 'variants'.
   */
  variantsSlug?: string
  /**
   * Slug of the variant types collection, defaults to 'variantTypes'.
   */
  variantTypesSlug?: string
}

export const createProductsCollection: (props: Props) => CollectionConfig = (props) => {
  const {
    access: { adminOnly, adminOrPublishedStatus },
    currenciesConfig,
    enableVariants = false,
    inventory = true,
    variantsSlug = 'variants',
    variantTypesSlug = 'variantTypes',
  } = props || {}

  const defaultFields = [
    ...(inventory
      ? [
          inventoryField({
            overrides: {
              admin: {
                condition: ({ enableVariants }) => !enableVariants,
              },
            },
          }),
        ]
      : []),
    ...(enableVariants ? variantsFields({ variantsSlug, variantTypesSlug }) : []),
    ...(currenciesConfig ? [...pricesField({ currenciesConfig })] : []),
  ]

  const baseConfig: CollectionConfig = {
    slug: 'products',
    access: {
      create: adminOnly,
      delete: adminOnly,
      read: adminOrPublishedStatus,
      update: adminOnly,
    },
    admin: {
      defaultColumns: [
        ...(currenciesConfig ? ['prices'] : []),
        ...(enableVariants ? ['variants'] : []),
      ],
      group: 'Ecommerce',
    },
    fields: defaultFields,
    trash: true,
    versions: {
      drafts: {
        autosave: true,
      },
    },
  }

  return baseConfig
}
