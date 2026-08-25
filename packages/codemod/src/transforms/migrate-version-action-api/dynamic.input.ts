import type { Payload } from 'payload'

export async function dynamicDraft(payload: Payload, shouldSaveDraft: boolean) {
  return payload.update({
    id: '1',
    collection: 'posts',
    data: {
      title: 'Dynamic',
    },
    draft: shouldSaveDraft,
  })
}
