import type { Payload } from 'payload'

export async function removeInlineFalseFlag(payload: Payload) {
  return fetch(`${payload.config.serverURL}${payload.config.routes.api}/graphql`, {
    method: 'POST',
    body: JSON.stringify({
      query: `mutation RemoveInlineFalseFlag { updatePost(action: publish data: {}) { id } }`,
    }),
  })
}
