import type { Payload } from 'payload'

export const createDeepNested = (payload: Payload) => {
  return payload.create({
    collection: 'deep-nested',
    data: {
      array: [
        {
          group: {
            title: 'some title',
            array: [
              {
                title: 'some title',
              },
            ],
          },
        },
      ],
      blocks: [
        {
          blockType: 'first',
          array: [
            {
              group: {
                title: 'some title',
              },
            },
          ],
        },
        {
          blockType: 'second',
          group: {
            title: 'some title',
          },
        },
      ],
    },
  })
}
