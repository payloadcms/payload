import type { CollectionConfig, Field } from 'payload'

import type {
  AccessConfig,
  CurrenciesConfig,
  FieldsOverride,
  InventoryConfig,
} from '../../types.js'

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
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
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
    overrides,
    variantsSlug = 'variants',
    variantTypesSlug = 'variantTypes',
  } = props || {}
  const fieldsOverride = overrides?.fields

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

  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields })
      : defaultFields

  const baseConfig: CollectionConfig = {
    slug: 'products',
    ...overrides,
    access: {
      create: adminOnly,
      delete: adminOnly,
      read: adminOrPublishedStatus,
      update: adminOnly,
      ...overrides?.access,
    },
    admin: {
      defaultColumns: [
        ...(currenciesConfig ? ['prices'] : []),
        ...(enableVariants ? ['variants'] : []),
      ],
      group: 'Ecommerce',
      ...overrides?.admin,
    },
    fields,
    versions: {
      drafts: {
        autosave: true,
      },
    },
  }

  return { ...baseConfig }
}
