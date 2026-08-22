export async function dynamicDraft(payload, shouldSaveDraft: boolean) {
  return payload.update({
    id: '1',
    collection: 'posts',
    data: {
      title: 'Dynamic',
    },
    draft: shouldSaveDraft,
  })
}
