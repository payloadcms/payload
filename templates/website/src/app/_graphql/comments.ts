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
  query Comments($doc: String) {
    Comments(where: { doc: { equals: $doc } }) {
      docs {
        ${COMMENT}
      }
    }
  }
`

export const COMMENTS_BY_USER = `
  query Comments($user: String) {
    Comments(where: { user: { equals: $user } }) {
      docs {
        ${COMMENT}
      }
    }
  }
`
