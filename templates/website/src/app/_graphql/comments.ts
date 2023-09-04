export const COMMENTS = `
  query Comments($doc: String) {
    Comments(where: { doc: { equals: $doc } }, limit: 300) {
      docs {
        id
        doc {
          id
        }
        fullUser {
          id
          name
        }
        comment
        createdAt
      }
    }
  }
`
