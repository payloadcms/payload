import type { Payload } from 'payload'

import { seedDB } from '../__helpers/shared/clearAndSeed/seed.js'
import { devUser } from '../credentials.js'
import { pointSlug, relationSlug, slug } from './shared.js'

export const seed = async (_payload: Payload) => {
  await _payload.create({
    collection: 'users',
    overrideAccess: true,
    data: {
      email: devUser.email,
      password: devUser.password,
    },
  })

  await _payload.create({
    collection: 'custom-ids',
    overrideAccess: true,
    data: {
      id: 1,
      title: 'hello',
    },
  })

  await _payload.create({
    collection: slug,
    overrideAccess: true,
    data: {
      relationToCustomID: 1,
      title: 'has custom ID relation',
    },
  })

  await _payload.create({
    collection: slug,
    overrideAccess: true,
    data: {
      title: 'post1',
    },
  })

  await _payload.create({
    collection: slug,
    overrideAccess: true,
    data: {
      title: 'post2',
    },
  })

  await _payload.create({
    collection: slug,
    overrideAccess: true,
    data: {
      description: 'description',
      title: 'with-description',
    },
  })

  await _payload.create({
    collection: slug,
    overrideAccess: true,
    data: {
      number: 1,
      title: 'numPost1',
    },
  })

  await _payload.create({
    collection: slug,
    overrideAccess: true,
    data: {
      number: 2,
      title: 'numPost2',
    },
  })

  const rel1 = await _payload.create({
    collection: relationSlug,
    overrideAccess: true,
    data: {
      name: 'name',
    },
  })

  const rel2 = await _payload.create({
    collection: relationSlug,
    overrideAccess: true,
    data: {
      name: 'name2',
    },
  })

  await _payload.create({
    collection: slug,
    overrideAccess: true,
    data: {
      relationHasManyField: rel1.id,
      title: 'rel to hasMany',
    },
  })

  await _payload.create({
    collection: slug,
    overrideAccess: true,
    data: {
      relationHasManyField: rel2.id,
      title: 'rel to hasMany 2',
    },
  })

  await _payload.create({
    collection: slug,
    overrideAccess: true,
    data: {
      relationMultiRelationTo: {
        relationTo: relationSlug,
        value: rel2.id,
      },
      title: 'rel to multi',
    },
  })

  await _payload.create({
    collection: slug,
    overrideAccess: true,
    data: {
      relationMultiRelationToHasMany: [
        {
          relationTo: relationSlug,
          value: rel1.id,
        },
        {
          relationTo: relationSlug,
          value: rel2.id,
        },
      ],
      title: 'rel to multi hasMany',
    },
  })

  const payloadAPITest1 = await _payload.create({
    collection: 'payload-api-test-ones',
    overrideAccess: true,
    data: {},
  })

  await _payload.create({
    collection: 'payload-api-test-twos',
    overrideAccess: true,
    data: {
      relation: payloadAPITest1.id,
    },
  })

  await _payload.create({
    collection: pointSlug,
    overrideAccess: true,
    data: {
      point: [10, 20],
    },
  })

  await _payload.create({
    collection: 'content-type',
    overrideAccess: true,
    data: {},
  })
}

export async function clearAndSeedEverything(_payload: Payload) {
  return await seedDB({
    _payload,
    collectionSlugs: _payload.config.collections.map((collection) => collection.slug),
    seedFunction: seed,
    snapshotKey: 'collectionsGraphQLTest',
  })
}
