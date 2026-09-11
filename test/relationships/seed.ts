import type { Payload } from 'payload'

import { seedDB } from '../__helpers/shared/clearAndSeed/seed.js'
import { devUser } from '../credentials.js'
import {
  chainedRelSlug,
  customIdNumberSlug,
  customIdSlug,
  defaultAccessRelSlug,
  relationSlug,
  slug,
} from './shared.js'

export const seed = async (_payload: Payload) => {
  await _payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
  })

  const rel1 = await _payload.create({
    collection: relationSlug,
    data: {
      name: 'name',
    },
  })

  const filteredRelation = await _payload.create({
    collection: relationSlug,
    data: {
      name: 'filtered',
    },
  })

  const defaultAccessRelation = await _payload.create({
    collection: defaultAccessRelSlug,
    data: {
      name: 'name',
    },
  })

  const chained3 = await _payload.create({
    collection: chainedRelSlug,
    data: {
      name: 'chain3',
    },
  })

  const chained2 = await _payload.create({
    collection: chainedRelSlug,
    data: {
      name: 'chain2',
      relation: chained3.id,
    },
  })

  const chained = await _payload.create({
    collection: chainedRelSlug,
    data: {
      name: 'chain1',
      relation: chained2.id,
    },
  })

  await _payload.update({
    id: chained3.id,
    collection: chainedRelSlug,
    data: {
      name: 'chain3',
      relation: chained.id,
    },
  })

  const customIdRelation = await _payload.create({
    collection: customIdSlug,
    data: {
      id: 'custommmm',
      name: 'custom-id',
    },
  })

  const customIdNumberRelation = await _payload.create({
    collection: customIdNumberSlug,
    data: {
      id: 908234892340,
      name: 'custom-id',
    },
  })

  await _payload.create({
    collection: slug,
    data: {
      chainedRelation: chained.id,
      customIdNumberRelation: customIdNumberRelation.id,
      customIdRelation: customIdRelation.id,
      defaultAccessRelation: defaultAccessRelation.id,
      filteredRelation: filteredRelation.id,
      maxDepthRelation: rel1.id,
      relationField: rel1.id,
      title: 'with relationship',
    },
  })

  const root = await _payload.create({
    collection: 'tree',
    data: {
      text: 'root',
    },
  })

  await _payload.create({
    collection: 'tree',
    data: {
      parent: root.id,
      text: 'sub',
    },
  })
}

export async function clearAndSeedEverything(_payload: Payload) {
  return await seedDB({
    _payload,
    collectionSlugs: _payload.config.collections.map((collection) => collection.slug),
    seedFunction: seed,
    snapshotKey: 'relationshipsTest',
  })
}
