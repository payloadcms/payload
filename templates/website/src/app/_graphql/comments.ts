const COMMENT = `
id
_status
doc {
  id
  slug
}
populatedUser {
  id
  name
}
comment
createdAt
`

export const COMMENTS_BY_DOC = `
  query Comments($doc: JSON) {
    Comments(where: { doc: { equals: $doc } }) {
      docs {
        ${COMMENT}
      }
    }
  }
`

export const COMMENTS_BY_USER = `
  query Comments($user: JSON) {
    Comments(where: { user: { equals: $user } }) {
      docs {
        ${COMMENT}
      }
    }
  }
`
