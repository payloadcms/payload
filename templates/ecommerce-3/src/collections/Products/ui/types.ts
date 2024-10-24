import type { Product } from '@/payload-types'

export type OptionKey = any //Product['variants']['options'][number]
export type Option = OptionKey['values'][number]
export type ProductVariant = any //Product['variants']['variants'][number]

export type KeysFieldValue = {
  options: (Option & { key: OptionKey })[]
}

export interface RadioGroupProps {
  /**
   * Required for sorting the array
   */
  fullArray: any //Product['variants']['options']
  group: OptionKey
  options: Option[]
  path: string
  setValue: (value: string[]) => void
  value: string[]
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
