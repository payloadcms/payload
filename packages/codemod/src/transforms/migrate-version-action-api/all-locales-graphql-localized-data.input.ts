import type { Payload } from 'payload'

export async function updateAllLocales(
  payload: Payload,
  data: { title: string },
) {
  return fetch(`${payload.config.serverURL}${payload.config.routes.api}/graphql?locale=es`, {
    method: 'POST',
    body: JSON.stringify({
      query: `
        mutation UpdateAllLocales($data: mutationPostInput!) {
          staticData: updatePost(id: "1", locale: es, action: publish, publishAllLocales: true, data: { title: "New Spanish" }) { id }
          dynamicData: updatePost(id: "2", locale: fr, action: publish, publishAllLocales: true, data: $data) { id }
          inheritedData: updatePost(id: "3", action: publish, publishAllLocales: true, data: { title: "Inherited Spanish" }) { id }
        }
      `,
      variables: { data },
    }),
  })
}
