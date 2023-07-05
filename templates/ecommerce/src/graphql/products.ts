import { gql } from '@apollo/client'

import { ARCHIVE_BLOCK, CALL_TO_ACTION, CONTENT, MEDIA_BLOCK } from './blocks'
import { CATEGORIES } from './categories'
import { FOOTER, HEADER, SETTINGS } from './globals'
import { META } from './meta'

export const PRODUCTS = gql`
  query Products {
    Products(limit: 300) {
      docs {
        slug
      }
    }
  }
`

export const PRODUCT = gql`
  query Product($slug: String ) {
    Products(where: { slug: { equals: $slug}}) {
      docs {
        id
        title
        ${CATEGORIES}
        layout {
          ${CALL_TO_ACTION}
          ${CONTENT}
          ${MEDIA_BLOCK}
          ${ARCHIVE_BLOCK}
        }
        paywall {
          ${CALL_TO_ACTION}
          ${CONTENT}
          ${MEDIA_BLOCK}
          ${ARCHIVE_BLOCK}
        }
        priceJSON
        ${META}
      }
    }
    ${HEADER}
    ${FOOTER}
    ${SETTINGS}
  }
`
