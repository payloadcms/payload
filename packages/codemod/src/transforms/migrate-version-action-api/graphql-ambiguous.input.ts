export const createWithoutMutationKeyword = `
  createPost(data: { title: "Hi" }, draft: true) {
    title
  }
`

export const urlConstant = '/api/posts?draft=true'

export const dynamicGraphql = `
  query Latest($includeDraft: Boolean) {
    Posts(draft: $includeDraft) {
      docs { title }
    }
  }
`
