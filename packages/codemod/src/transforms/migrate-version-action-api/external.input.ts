import type { Payload } from 'payload'

declare const payload: Payload
declare const client: {
  find(options: { collection: string; draft: boolean }): Promise<unknown>
}

void payload.find({ collection: 'posts', draft: true })
void client.find({ collection: 'articles', draft: true })
void fetch('https://other.example/posts?draft=true')
void fetch('/api/feature-flags?draft=true')
void fetch('/api/graphql', {
  method: 'POST',
  body: JSON.stringify({
    query: `query ThirdPartyQuery { Articles(draft: true) { id } }`,
  }),
})

const thirdPartyQuery = `
  query Articles {
    Articles(draft: true) { id }
  }
`

void thirdPartyQuery
