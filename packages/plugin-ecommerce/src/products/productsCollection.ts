import type { CollectionConfig, Field } from 'payload'

import type { CurrenciesConfig, FieldsOverride, InventoryConfig } from '../types.js'

import { inventoryField } from '../fields/inventoryField.js'
import { pricesField } from '../fields/pricesField.js'
import { variantsFields } from '../fields/variantsFields.js'

type Props = {
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

export const productsCollection: (props: Props) => CollectionConfig = (props) => {
  const {
    currenciesConfig,
    inventory = true,
    overrides,
    variantsSlug = 'variants',
    variantTypesSlug = 'variantTypes',
  } = props || {}
  const fieldsOverride = overrides?.fields
  const enableVariants = props?.enableVariants ?? false

  const defaultFields: Field[] = [
    {
      name: 'name',
      type: 'text',
    },
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
  ]

  const baseFields = [
    ...defaultFields,
    ...(enableVariants ? variantsFields({ variantsSlug, variantTypesSlug }) : []),
    ...(currenciesConfig ? [...pricesField({ currenciesConfig })] : []),
  ]

  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields: baseFields })
      : baseFields

  const baseConfig: CollectionConfig = {
    slug: 'products',
    ...overrides,
    admin: {
      defaultColumns: [
        'name',
        ...(currenciesConfig ? ['prices'] : []),
        ...(enableVariants ? ['variants'] : []),
      ],
      useAsTitle: 'name',
      ...overrides?.admin,
    },
    fields,
  }

  return { ...baseConfig }
}
