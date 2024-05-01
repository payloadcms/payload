import type { Payload } from 'payload/types'

export const globalSlug = 'someGlobal'

export const createGlobal = async (payload: Payload) => {
  const relFirst = await payload.create({
    collection: 'relationships-items',
    data: {
      title: 'title',
      subtitle: 'subtitle',
    },
  })

  const relSecond = await payload.create({
    collection: 'relationships-items',
    data: {
      title: 'title',
      subtitle: 'subtitle',
    },
  })

  return payload.updateGlobal({
    slug: globalSlug,
    data: {
      relFirst: relFirst.id,
      relSecond: relSecond.id,
      title: 'some title',
      label: 'some label',
    },
  })
}
