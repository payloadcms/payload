import { ARCHIVE_BLOCK, CALL_TO_ACTION, CONTENT, MEDIA_BLOCK } from './blocks'
import { CATEGORIES } from './categories'
import { META } from './meta'

export const PRODUCTS = `
  query Products {
    Products(limit: 300) {
      docs {
        slug
      }
    }
  }
`

export const PRODUCT = `
  query Product($slug: String ) {
    Products(where: { slug: { equals: $slug}}) {
      docs {
        id
        title
        stripeProductID
        ${CATEGORIES}
        layout {
          ${CALL_TO_ACTION}
          ${CONTENT}
          ${MEDIA_BLOCK}
          ${ARCHIVE_BLOCK}
        }
        priceJSON
        ${META}
        enablePaywall
      }
    }
  }
`

export const PRODUCT_PAYWALL = `
  query Product($slug: String ) {
    Products(where: { slug: { equals: $slug}}) {
      docs {
        paywall {
          ${CALL_TO_ACTION}
          ${CONTENT}
          ${MEDIA_BLOCK}
          ${ARCHIVE_BLOCK}
        }
      }
    }
  }
`
