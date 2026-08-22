import { gql } from 'graphql-tag'

export const latestPosts = gql`
  query LatestPosts {
    Posts(version: latest) {
      docs {
        title
      }
    }
  }
`

export const publishedPost = `
  query PublishedPost($id: String!) {
    Post(id: $id, version: published) {
      title
    }
  }
`

export const createDraft = gql`
  mutation CreateDraft {
    createPost(data: { title: "Hi" }, action: saveDraft) {
      title
    }
  }
`
