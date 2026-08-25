export async function queryPayloadGraphQL() {
  const latestPosts = await fetch('/api/graphql', {
    method: 'POST',
    body: JSON.stringify({
      query: `
        query LatestPosts {
          Posts(draft: true) {
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
          Post(id: $id, draft: false) { title }
        }
      `,
    }),
  })

  const createDraft = await fetch('/api/graphql', {
    method: 'POST',
    body: JSON.stringify({
      query: `
        mutation CreateDraft {
          createPost(data: { title: "Hi" }, draft: true) { title }
        }
      `,
    }),
  })

  return { createDraft, latestPosts, publishedPost }
}
