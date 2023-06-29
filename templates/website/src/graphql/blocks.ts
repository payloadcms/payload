import { CATEGORIES } from './categories'
import { FORM_FIELDS } from './form'
import { LINK_FIELDS } from './link'
import { MEDIA } from './media'
import { META } from './meta'

export const CALL_TO_ACTION = `
...on Cta {
  blockType
  ctaBackgroundColor
  richText
  links {
    link ${LINK_FIELDS()}
  }
}
`

export const CONTENT = `
...on Content {
  blockType
  backgroundColor
  columns {
    size
    richText
    enableLink
    link ${LINK_FIELDS()}
  }
}
`

export const MEDIA_BLOCK = `
...on MediaBlock {
  blockType
  mediaBlockBackgroundColor
  position
  ${MEDIA}
}
`

export const ARCHIVE_BLOCK = `
...on Archive {
  blockType
  introContent
  populateBy
  relationTo
  ${CATEGORIES}
  limit
  selectedDocs {
    relationTo
    value {
      ...on Page {
        id
        slug
        title
        publishedDate
      }
      ...on Post {
        id
        slug
        title
        publishedDate
      }
    }
  }
  populatedDocs {
    relationTo
    value {
      ...on Page {
        id
        slug
        title
        publishedDate
        ${META}
      }
      ...on Post {
        id
        slug
        title
        publishedDate
        ${META}
      }
    }
  }
  populatedDocsTotal
}
`

export const FORM_BLOCK = `
...on FormBlock {
  blockType
  enableIntro
  formIntroContent
  form ${FORM_FIELDS}
}
`
