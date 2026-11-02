import type { Payload } from 'payload'

import { devUser } from '../credentials.js'
import {
  collection1Slug,
  collection2Slug,
  podcastCollectionSlug,
  relationOneSlug,
  relationRestrictedSlug,
  relationTwoSlug,
  relationWithTitleSlug,
  slug,
  videoCollectionSlug,
} from './slugs.js'

export const seed = async (_payload: Payload) => {
  await _payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
    depth: 0,
    overrideAccess: true,
  })

  // Create docs to relate to
  const { id: relationOneDocId } = await _payload.create({
    collection: relationOneSlug,
    data: {
      name: relationOneSlug,
    },
    depth: 0,
    overrideAccess: true,
  })

  const relationOneIDs: string[] = []

  for (let i = 0; i < 11; i++) {
    const doc = await _payload.create({
      collection: relationOneSlug,
      data: {
        name: relationOneSlug,
      },
      depth: 0,
      overrideAccess: true,
    })
    relationOneIDs.push(doc.id)
  }

  const relationTwoIDs: string[] = []
  for (let i = 0; i < 11; i++) {
    const doc = await _payload.create({
      collection: relationTwoSlug,
      data: {
        name: relationTwoSlug,
      },
      depth: 0,
      overrideAccess: true,
    })
    relationTwoIDs.push(doc.id)
  }

  // Existing relationships
  const { id: restrictedDocId } = await _payload.create({
    collection: relationRestrictedSlug,
    data: {
      name: 'relation-restricted',
    },
    depth: 0,
    overrideAccess: true,
  })

  const relationsWithTitle: string[] = []

  for (const title of ['relation-title', 'word boundary search']) {
    const { id } = await _payload.create({
      collection: relationWithTitleSlug,
      data: {
        name: title,
        meta: {
          title,
        },
      },
      depth: 0,
      overrideAccess: true,
    })
    relationsWithTitle.push(id)
  }

  await _payload.create({
    collection: slug,
    data: {
      relationship: relationOneDocId,
      relationshipRestricted: restrictedDocId,
      relationshipWithTitle: relationsWithTitle[0],
    },
    depth: 0,
    overrideAccess: true,
  })

  for (let i = 0; i < 11; i++) {
    await _payload.create({
      collection: slug,
      data: {
        relationship: relationOneDocId,
        relationshipHasManyMultiple: relationOneIDs.map((id) => ({
          relationTo: relationOneSlug,
          value: id,
        })),
        relationshipRestricted: restrictedDocId,
      },
      depth: 0,
      overrideAccess: true,
    })
  }

  for (let i = 0; i < 15; i++) {
    const relationOneID = relationOneIDs[Math.floor(Math.random() * 10)]
    const relationTwoID = relationTwoIDs[Math.floor(Math.random() * 10)]

    await _payload.create({
      collection: slug,
      data: {
        relationship: relationOneDocId,
        relationshipHasMany: [relationOneID],
        relationshipHasManyMultiple: [{ relationTo: relationTwoSlug, value: relationTwoID }],
        relationshipReadOnly: relationOneID,
        relationshipRestricted: restrictedDocId,
      },
      depth: 0,
      overrideAccess: true,
    })
  }

  for (let i = 0; i < 15; i++) {
    await _payload.create({
      collection: collection1Slug,
      data: {
        name: `relationship-test ${i}`,
      },
      depth: 0,
      overrideAccess: true,
    })

    await _payload.create({
      collection: collection2Slug,
      data: {
        name: `relationship-test ${i}`,
      },
      depth: 0,
      overrideAccess: true,
    })
  }

  for (let i = 0; i < 2; i++) {
    await _payload.create({
      collection: videoCollectionSlug,
      data: {
        id: i,
        title: `Video ${i}`,
      },
      overrideAccess: true,
    })

    await _payload.create({
      collection: podcastCollectionSlug,
      data: {
        id: i,
        title: `Podcast ${i}`,
      },
      overrideAccess: true,
    })
  }
}
