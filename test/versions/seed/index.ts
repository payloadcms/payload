import type { Config } from '../../../packages/payload/src/config/types'

import { devUser } from '../../credentials'
import { draftSlug, titleToDelete } from '../shared'

export const seed: Config['onInit'] = async (payload) => {
  await payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
  })

  const blocksField = [
    {
      blockType: 'block',
      localized: 'text',
      text: 'text',
    },
  ]

  await payload.create({
    collection: draftSlug,
    data: {
      blocksField,
      description: 'Draft Description',
      radio: 'test',
      title: 'Draft Title',
    },
    draft: true,
  })

  const { id: manyDraftsID } = await payload.create({
    collection: draftSlug,
    data: {
      blocksField,
      description: 'Draft Description',
      radio: 'test',
      title: 'Title With Many Versions',
    },
    draft: true,
  })

  for (let i = 0; i < 9; i++) {
    await payload.update({
      id: manyDraftsID,
      collection: draftSlug,
      data: {
        title: `Title With Many Versions ${i + 2}`,
      },
    })
  }

  await payload.create({
    collection: draftSlug,
    data: {
      _status: 'published',
      blocksField,
      description: 'published description',
      radio: 'test',
      title: 'Published Title',
    },
    draft: false,
  })

  await payload.create({
    collection: draftSlug,
    data: {
      blocksField,
      description: 'published description',
      title: titleToDelete,
    },
    draft: true,
  })
}
