import type { Payload } from 'payload'

import { hierarchySlug } from '../slugs.js'

export async function seedHierarchy(payload: Payload) {
  const parent1 = await payload.create({
    collection: hierarchySlug,
    data: { name: 'Parent 1' },
  })
  const parent2 = await payload.create({
    collection: hierarchySlug,
    data: { name: 'Parent 2' },
  })

  await payload.create({
    collection: hierarchySlug,
    data: { name: 'Child 1a', parent: parent1.id },
  })
  await payload.create({
    collection: hierarchySlug,
    data: { name: 'Child 1b', parent: parent1.id },
  })

  await payload.create({
    collection: hierarchySlug,
    data: { name: 'Child 2a', parent: parent2.id },
  })
  await payload.create({
    collection: hierarchySlug,
    data: { name: 'Child 2b', parent: parent2.id },
  })
}
