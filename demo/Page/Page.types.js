export default `
  type Page {
    id: String
    title: String
    content: String
    metaTitle: String
    metaDesc: String
    createdAt: String
    updatedAt: String
  }

  type Query {
    page(id: String!, locale: String): Page
    pages: [Page]
  }

  type Mutation {
    addPage(title: String, content: String): Page
  }
`;
