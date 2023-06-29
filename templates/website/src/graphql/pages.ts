import { ARCHIVE_BLOCK, CALL_TO_ACTION, CONTENT, FORM_BLOCK, MEDIA_BLOCK } from './blocks'
import { LINK_FIELDS } from './link'
import { MEDIA } from './media'
import { META } from './meta'

export const PAGES = `
  query Pages {
    Pages(limit: 300)  {
      docs {
        slug
        breadcrumbs {
          url
          label
        }
      }
    }
  }
`

export const PAGE = `
  query Page($slug: String ) {
    Pages(where: { slug: { equals: $slug} }) {
      docs {
        id
        title
        publishedDate
        hero {
          type
          richText
          links {
            link ${LINK_FIELDS()}
          }
          ${MEDIA}
        }
        layout {
          ${ARCHIVE_BLOCK}
          ${CALL_TO_ACTION}
          ${CONTENT}
          ${FORM_BLOCK}
          ${MEDIA_BLOCK}
        }
        ${META}
        breadcrumbs {
          url
          label
        }
      }
    }
  }
`
