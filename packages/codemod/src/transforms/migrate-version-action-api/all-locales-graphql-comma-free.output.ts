import type { Payload } from 'payload'

export async function removeFalseFlag(payload: Payload) {
  return fetch(`${payload.config.serverURL}${payload.config.routes.api}/graphql`, {
    method: 'POST',
    body: JSON.stringify({
      query: `
        mutation RemoveFalseFlag {
          updatePost(
            id: "1"
            action: publish
            data: {}
          ) { id }
        }
      `,
    }),
  })
}
