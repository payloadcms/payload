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
          blockName: null,
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
          blockName: null,
          group: {
            title: 'some title',
          },
        },
      ],
    },
  })
}
