import type { Payload } from 'payload'

declare const payload: Payload
declare const client: {
  find(options: { collection: string; draft: boolean }): Promise<unknown>
}

void payload.find({ collection: 'posts', version: 'latest' })
void client.find({ collection: 'articles', draft: true })
void fetch('https://other.example/posts?draft=true')

const thirdPartyQuery = `
  query Articles {
    Articles(draft: true) { id }
  }
`

void thirdPartyQuery
