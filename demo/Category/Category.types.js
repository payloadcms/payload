export default `
  input CategoryInput {
    title: String!
    description: String
  }

  type Category {
    id: String
    title: String
    description: String
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
