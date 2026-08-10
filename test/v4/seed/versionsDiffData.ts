import type { Payload } from 'payload'

import { tagsSlug, uploadsSlug, versionsDiffSlug } from '../slugs.js'

export async function seedVersionsDiff(payload: Payload) {
  const tagDocs = await payload.find({ collection: tagsSlug, limit: 3 })
  const tagIds = tagDocs.docs.map((d) => d.id)

  const uploadDocs = await payload.find({ collection: uploadsSlug, limit: 2 })
  const uploadIds = uploadDocs.docs.map((d) => d.id)

  const versionsDiffDoc = await payload.create({
    collection: versionsDiffSlug,
    data: {
      _status: 'published',
      array: [{ arrayText: 'First item' }, { arrayText: 'Second item' }],
      blocks: [{ blockText: 'Original block text', blockType: 'textBlock' }],
      checkbox: false,
      code: 'const x = 1;',
      date: '2024-01-15T00:00:00.000Z',
      description: 'Original description text',
      email: 'original@example.com',
      group: {
        nestedNumber: 100,
        nestedText: 'Original nested',
      },
      json: { key: 'original' },
      number: 42,
      numberMany: [1, 2, 3],
      point: [10, 20],
      radio: 'small',
      relationship: tagIds[0],
      relationshipMany: [tagIds[0]!, tagIds[1]!],
      select: 'option-1',
      selectMany: ['option-1', 'option-2'],
      tabNumber: 10,
      tabText: 'Original tab text',
      title: 'Original Title',
      upload: uploadIds[0],
      uploadMany: uploadIds.length > 1 ? [uploadIds[0]!, uploadIds[1]!] : [uploadIds[0]!],
    },
  })

  await payload.update({
    id: versionsDiffDoc.id,
    collection: versionsDiffSlug,
    data: {
      _status: 'published',
      array: [{ arrayText: 'Updated first item' }, { arrayText: 'New third item' }],
      blocks: [
        { blockText: 'Updated block text', blockType: 'textBlock' },
        { blockNumber: 42, blockType: 'numberBlock' },
      ],
      checkbox: true,
      code: 'const x = 2;\nconst y = 3;',
      date: '2025-06-01T00:00:00.000Z',
      description: 'Updated description with more content',
      email: 'updated@example.com',
      group: {
        nestedNumber: 200,
        nestedText: 'Updated nested',
      },
      json: { extra: true, key: 'updated' },
      number: 99,
      numberMany: [4, 5],
      point: [30, 40],
      radio: 'large',
      relationship: tagIds[1],
      relationshipMany: [tagIds[1]!, tagIds[2]!],
      select: 'option-2',
      selectMany: ['option-2', 'option-3'],
      tabNumber: 50,
      tabText: 'Updated tab text',
      title: 'Updated Title',
      upload: uploadIds[1] || uploadIds[0],
      uploadMany: uploadIds.length > 1 ? [uploadIds[1]!] : [uploadIds[0]!],
    },
  })
}
