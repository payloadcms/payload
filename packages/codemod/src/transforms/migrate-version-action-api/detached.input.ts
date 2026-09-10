const opts = {
  collection: 'posts',
  draft: true,
  limit: 5,
}

export async function detached(payload) {
  return payload.find(opts)
}
