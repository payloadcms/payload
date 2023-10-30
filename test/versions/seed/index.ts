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

  const { id: draftID } = await payload.create({
    collection: draftSlug,
    data: {
      id: 1,
      blocksField,
      description: 'draft description',
      radio: 'test',
      title: 'draft title',
    },
    draft: true,
  })

  await payload.create({
    collection: draftSlug,
    data: {
      id: 2,
      _status: 'published',
      blocksField,
      description: 'published description',
      radio: 'test',
      title: 'published title',
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

  for (let i = 0; i < 10; i++) {
    await payload.update({
      id: draftID,
      collection: draftSlug,
      data: {
        title: `draft title ${i + 2}`,
      },
      draft: true,
    })
  }
}
