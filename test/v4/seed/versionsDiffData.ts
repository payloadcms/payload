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
      title: 'Original Title',
      array: [{ arrayText: 'First item' }, { arrayText: 'Second item' }],
      blocks: [{ blockType: 'textBlock', blockText: 'Original block text' }],
      checkbox: false,
      code: 'const x = 1;',
      date: '2024-01-15T00:00:00.000Z',
      description: 'Original description text',
      email: 'original@example.com',
      group: {
        nestedText: 'Original nested',
        nestedNumber: 100,
      },
      json: { key: 'original' },
      number: 42,
      numberMany: [1, 2, 3],
      point: [10, 20],
      radio: 'small',
      relationship: tagIds[0],
      relationshipMany: [tagIds[0], tagIds[1]],
      select: 'option-1',
      selectMany: ['option-1', 'option-2'],
      tabText: 'Original tab text',
      tabNumber: 10,
      upload: uploadIds[0],
      uploadMany: uploadIds.length > 1 ? [uploadIds[0], uploadIds[1]] : [uploadIds[0]],
      _status: 'published',
    },
  })

  await payload.update({
    collection: versionsDiffSlug,
    id: versionsDiffDoc.id,
    data: {
      title: 'Updated Title',
      array: [{ arrayText: 'Updated first item' }, { arrayText: 'New third item' }],
      blocks: [
        { blockType: 'textBlock', blockText: 'Updated block text' },
        { blockType: 'numberBlock', blockNumber: 42 },
      ],
      checkbox: true,
      code: 'const x = 2;\nconst y = 3;',
      date: '2025-06-01T00:00:00.000Z',
      description: 'Updated description with more content',
      email: 'updated@example.com',
      group: {
        nestedText: 'Updated nested',
        nestedNumber: 200,
      },
      json: { key: 'updated', extra: true },
      number: 99,
      numberMany: [4, 5],
      point: [30, 40],
      radio: 'large',
      relationship: tagIds[1],
      relationshipMany: [tagIds[1], tagIds[2]],
      select: 'option-2',
      selectMany: ['option-2', 'option-3'],
      tabText: 'Updated tab text',
      tabNumber: 50,
      upload: uploadIds[1] || uploadIds[0],
      uploadMany: uploadIds.length > 1 ? [uploadIds[1]] : [uploadIds[0]],
      _status: 'published',
    },
  })
}
