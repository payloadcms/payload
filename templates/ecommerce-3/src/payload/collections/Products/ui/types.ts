import type { Product } from '@/payload-types'

export type OptionKey = Product['variants']['keys'][number]
export type Option = OptionKey['options'][number]
export type ProductVariant = Product['variants']['variants'][number]

export type KeysFieldValue = {
  options: (Option & { key: OptionKey })[]
}

export interface RadioGroupProps {
  /**
   * Required for sorting the array
   */
  fullArray: Product['variants']['keys']
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
