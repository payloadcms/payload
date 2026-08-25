export async function queryPayloadGraphQL() {
  const latestPosts = await fetch('/api/graphql', {
    method: 'POST',
    body: JSON.stringify({
      query: `
        query LatestPosts {
          Posts(version: latest) {
            docs { title }
          }
        }
      `,
    }),
  })

  const publishedPost = await fetch('/api/graphql', {
    method: 'POST',
    body: JSON.stringify({
      query: `
        query PublishedPost($id: String!) {
          Post(id: $id, version: published) { title }
        }
      `,
    }),
  })

  const createDraft = await fetch('/api/graphql', {
    method: 'POST',
    body: JSON.stringify({
      query: `
        mutation CreateDraft {
          createPost(data: { title: "Hi" }, action: saveDraft) { title }
        }
      `,
    }),
  })

  return { createDraft, latestPosts, publishedPost }
}
