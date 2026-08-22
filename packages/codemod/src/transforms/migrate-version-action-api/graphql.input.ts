import { gql } from 'graphql-tag'

export const latestPosts = gql`
  query LatestPosts {
    Posts(draft: true) {
      docs {
        title
      }
    }
  }
`

export const publishedPost = `
  query PublishedPost($id: String!) {
    Post(id: $id, draft: false) {
      title
    }
  }
`

export const createDraft = gql`
  mutation CreateDraft {
    createPost(data: { title: "Hi" }, draft: true) {
      title
    }
  }
`
