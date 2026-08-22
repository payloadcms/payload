function withDraft(options) {
  return {
    ...options,
    collection: 'posts',
    draft: true,
  }
}

export async function wrapper(payload) {
  return payload.find(withDraft({ limit: 10 }))
}
