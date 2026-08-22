export async function localizedStatus(payload) {
  return payload.update({
    id: '1',
    collection: 'posts',
    data: {
      _status: {
        en: 'draft',
        es: 'published',
      },
      title: 'Localized',
    },
    draft: true,
  })
}

export async function computedStatus(payload, existingDoc) {
  return payload.update({
    id: '1',
    collection: 'posts',
    data: existingDoc,
    draft: true,
  })
}
