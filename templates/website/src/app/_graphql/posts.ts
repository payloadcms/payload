import { ARCHIVE_BLOCK, CALL_TO_ACTION, CONTENT, MEDIA_BLOCK } from './blocks'
import { CATEGORIES } from './categories'
import { LINK_FIELDS } from './link'
import { MEDIA } from './media'
import { META } from './meta'

export const POSTS = `
  query Posts {
    Posts(limit: 300)  {
      docs {
        slug
      }
    }
  }
`

export const POST = `
  query Post($slug: String ) {
    Posts(where: { AND: [{ slug: { equals: $slug }}] }) {
      docs {
        id
        title
        ${CATEGORIES}
        hero {
          type
          richText
          links {
            link ${LINK_FIELDS()}
          }
          ${MEDIA}
        }
        layout {
          ${CONTENT}
          ${CALL_TO_ACTION}
          ${MEDIA_BLOCK}
          ${ARCHIVE_BLOCK}
        }
        ${META}
      }
    }
  }
`
