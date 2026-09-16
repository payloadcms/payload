import type { Payload } from 'payload'

export async function updateAllLocales(payload: Payload) {
  return fetch(`${payload.config.serverURL}${payload.config.routes.api}/graphql`, {
    method: 'POST',
    body: JSON.stringify({
      query: `
        mutation UpdateAllLocales {
          updatePost(id: "1", action: publish, locale: all, data: {}) { id }
          updatePage(id: "2", locale: all, action: unpublish, data: {}) { id }
          updateArticle(id: "3", action: publish, data: {}) { id }
          updateProduct(id: "4", locale: all, action: publish) { id }
        }
      `,
    }),
  })
}
