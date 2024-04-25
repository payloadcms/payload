import type { Payload } from 'payload'

export const createLocalizedPost = async (payload: Payload) => {
  const { id, array } = await payload.create({
    collection: 'localized-posts',
    locale: 'en',
    data: {
      title: 'title en',
      arrayLocalized: [
        {
          title: 'title en',
        },
      ],
      array: [
        {
          title: 'title en',
        },
      ],
    },
  })

  return payload.update({
    collection: 'localized-posts',
    locale: 'de',
    id,
    data: {
      title: 'title de',
      arrayLocalized: [
        {
          title: 'title de',
        },
      ],
      array: [
        {
          ...array[0],
          title: 'title de',
        },
      ],
    },
  })
}
