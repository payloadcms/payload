import type { Config } from '../../../packages/payload/src/config/types'

import { mapAsync } from '../../../packages/payload/src/utilities/mapAsync'
import { devUser } from '../../credentials'
import { customViews1Slug } from '../collections/CustomViews1'
import { customViews2Slug, noApiViewCollection, postsSlug } from '../shared'

export const seed: Config['onInit'] = async (payload) => {
  await payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
  })

  await mapAsync([...Array(11)], async () => {
    await payload.create({
      collection: postsSlug,
      data: {
        title: 'Title',
        description: 'Description',
      },
    })
  })

  await payload.create({
    collection: customViews1Slug,
    data: {
      title: 'Custom View',
    },
  })

  await payload.create({
    collection: customViews2Slug,
    data: {
      title: 'Custom View',
    },
  })

  await payload.create({
    collection: 'geo',
    data: {
      point: [7, -7],
    },
  })

  await payload.create({
    collection: 'geo',
    data: {
      point: [5, -5],
    },
  })

  await payload.create({
    collection: noApiViewCollection,
    data: {},
  })
}
