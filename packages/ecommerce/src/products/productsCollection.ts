import type { CollectionConfig, Field } from 'payload'

import type { CurrenciesConfig, FieldsOverride } from '../types.js'

import { pricesField } from '../fields/pricesField.js'
import { variantsFields } from '../fields/variantsFields.js'

type Props = {
  currenciesConfig: CurrenciesConfig
  enableVariants?: boolean
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}

export const productsCollection: (props?: Props) => CollectionConfig = (props) => {
  const { currenciesConfig, overrides } = props || {}
  const fieldsOverride = overrides?.fields
  const enableVariants = props?.enableVariants ?? false

  const defaultFields: Field[] = [
    {
      name: 'name',
      type: 'text',
    },
  ]

  const baseFields = [
    ...defaultFields,
    ...(enableVariants ? variantsFields() : []),
    ...(currenciesConfig ? [pricesField({ currenciesConfig, enableVariants })] : []),
  ]

  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields: baseFields })
      : baseFields

  const baseConfig: CollectionConfig = {
    slug: 'products',
    ...overrides,
    admin: {
      defaultColumns: ['name', 'prices', ...(enableVariants ? ['variants'] : [])],
      useAsTitle: 'name',
      ...overrides?.admin,
    },
    fields,
  }

  return { ...baseConfig }
}
