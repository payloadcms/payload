import type { Payload } from 'payload'

export async function updateEscapedString(payload: Payload) {
  return fetch(`${payload.config.serverURL}${payload.config.routes.api}/graphql`, {
    method: 'POST',
    body: JSON.stringify({
      query: "mutation EscapedTitle { updatePost(action: publish, publishAllLocales: true, data: { title: \"hello \\\"world\\\"\" }) { id } }",
    }),
  })
}
