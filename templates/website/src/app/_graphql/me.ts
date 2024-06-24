export const ME_QUERY = `query {
  meUser {
    user {
      id
      email
      name
      roles
    }
    exp
  }
}`
