import type { Product } from '@/payload-types'

export type ProductVariant = NonNullable<NonNullable<Product['variants']>['variants']>[number]
export type Option = NonNullable<Product['variants']>['options'][number]
export type OptionKey = NonNullable<Option['values']>[number]

export type KeysFieldValue = {
  options: (Option & { key: OptionKey })[]
}

export interface RadioGroupProps {
  /**
   * Required for sorting the array
   */
  fullArray: NonNullable<Product['variants']>['options']
  group: OptionKey
  options: OptionKey[]
  path: string
  setValue: (value: Option[]) => void
  /**
   * Field values
   */
  values: Option[]
}

export type InfoType = {
  options: {
    key: {
      label: OptionKey['label']
      slug: OptionKey['slug']
    }
    label: Option['label']
    slug: Option['slug']
  }[]
  price: {
    amount: number
    currency: string
  }
  productName: string
  stock: number
}
