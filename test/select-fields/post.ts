import type { Payload } from 'payload'

export const createPost = async (payload: Payload) => {
  // const category = await payload.create({
  //   collection: 'categories',
  //   data: { title: 'some category' },
  // })

  return payload.create({
    collection: 'posts',
    data: {
      title: 'someText',
      array: [
        {
          title: 'some test',
        },
      ],
      group: {
        title: 'some title',
      },
      groupArray: {
        title: 'some title',
        array: [
          {
            title: 'some test',
          },
        ],
      },
      arrayMultiple: [
        {
          titleFirst: 'some title',
          titleSecond: 'some title second',
        },
      ],
      groupMultiple: {
        titleFirst: 'some title',
        titleSecond: 'some title second',
      },
      blocks: [
        {
          blockType: 'section',
          title: 'some title',
          secondTitle: 'some title',
          blockName: null,
        },
        {
          blockType: 'cta',
          cta: 'some cta',
          blockName: null,
        },
      ],
      select: ['hello', 'world'],
      tab: {
        title: 'some test',
        label: 'label',
      },
    },
  })
}
