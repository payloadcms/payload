export default `
  input CategoryInput {
    title: String!
    content: String
    metaTitle: String
    metaDesc: String
  }

  type Category {
    id: String
    title: String
    content: String
    metaTitle: String
    metaDesc: String
    createdAt: String
    updatedAt: String
  }

  type Query {
    category(id: String!, locale: String): Category
    categories(locale: String): [Category]
  }

  type Mutation {
    createCategory(input: CategoryInput): Category
  }
`;
