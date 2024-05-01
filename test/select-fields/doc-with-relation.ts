import type { Payload } from 'payload/types'

export const createDocWithRelation = async (payload: Payload) => {
  const docNested = await payload.create({
    collection: 'relationships-items-nested',
    data: {
      title: 'some title',
      subtitle: 'subtitle',
    },
  })
  const doc = await payload.create({
    collection: 'relationships-items',
    data: {
      title: 'some title',
      subtitle: 'subtitle',
      nested: docNested.id,
    },
  })

  const docOther = await payload.create({
    collection: 'relationships-items',
    data: {
      title: 'some title',
      subtitle: 'subtitle',
      nested: docNested.id,
    },
  })

  return payload.create({
    collection: 'relationships',
    data: {
      item: doc.id,
      other: docOther.id,
      withDefaultPopulate: doc.id,
      polymorphic: {
        relationTo: 'relationships-items-nested',
        value: docNested.id,
      },
      polymorphicDefault: {
        relationTo: 'relationships-items',
        value: docOther.id,
      },
      array: [
        {
          item: doc.id,
        },
      ],
    },
  })
}
