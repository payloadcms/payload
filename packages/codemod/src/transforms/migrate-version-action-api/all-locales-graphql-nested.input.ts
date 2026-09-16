import type { Payload } from 'payload'

export async function updateNestedData(payload: Payload) {
  return fetch(`${payload.config.serverURL}${payload.config.routes.api}/graphql`, {
    method: 'POST',
    body: JSON.stringify({
      query: `
        mutation UpdateNestedData {
          updatePost(
            id: "1"
            action: publish
            publishAllLocales: true
            data: {
              locale: "nested-value"
              note: "publishAllLocales: true locale: es (nested)"
              publishAllLocales: true
            }
          ) { id }
          updatePage(
            id: "2"
            action: publish
            locale: en
            data: { publishAllLocales: true }
          ) { id }
        }
      `,
    }),
  })
}
