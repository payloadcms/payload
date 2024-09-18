export type SortFilterItem = {
  reverse: boolean
  slug: null | string
  title: string
}

export const defaultSort: SortFilterItem = {
  slug: null,
  reverse: false,
  title: 'Alphabetic A-Z',
}

export const sorting: SortFilterItem[] = [
  defaultSort,
  { slug: '-createdAt', reverse: true, title: 'Latest arrivals' },
  { slug: 'price', reverse: false, title: 'Price: Low to high' }, // asc
  { slug: '-price', reverse: true, title: 'Price: High to low' },
]

export const TAGS = {
  cart: 'cart',
  collections: 'collections',
  products: 'products',
}

export const HIDDEN_PRODUCT_TAG = 'nextjs-frontend-hidden'
export const DEFAULT_OPTION = 'Default Title'
