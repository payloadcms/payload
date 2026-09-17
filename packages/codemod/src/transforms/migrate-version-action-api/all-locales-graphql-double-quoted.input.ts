import type { Payload } from 'payload'

export async function updateDoubleQuotedOperation(payload: Payload) {
  return fetch(`${payload.config.serverURL}${payload.config.routes.api}/graphql`, {
    method: 'POST',
    body: JSON.stringify({
      query: "mutation PublishAllLocales { updatePost(action: publish, publishAllLocales: true, data: {}) { id } }",
    }),
  })
}
