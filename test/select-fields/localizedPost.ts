import type { Payload } from 'payload'

export const createLocalizedPost = async (payload: Payload) => {
  const { id, array, arrayLocalized, blocks } = await payload.create({
    collection: 'localized-posts',
    locale: 'en',
    data: {
      title: 'title en',
      // group: {
      //   title: 'title en',
      // },
      // groupLocalized: {
      //   title: 'title en',
      // },
      blocks: [{ blockName: null, blockType: 'some', title: 'title en' }],
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
      // group: {
      //   title: 'title de',
      // },
      // groupLocalized: {
      //   title: 'title de',
      // },
      blocks: [
        {
          blockType: 'some',
          blockName: null,
          title: 'title de',
        },
      ],
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
