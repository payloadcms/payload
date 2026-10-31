import { describe, expect, it } from 'vitest'

import {
  createCreatedByField,
  createUpdatedByField,
} from '../fields/baseFields/authorship/index.js'
import { stripBranchMergeData, stripBranchMergeGlobalData } from './stripBranchMergeData.js'

describe('stripBranchMergeData', () => {
  it('should remove branch metadata and Payload-managed authorship values', () => {
    const fields = [
      { name: 'title', type: 'text' as const },
      createCreatedByField({ authCollections: ['users'] }),
      createUpdatedByField({ authCollections: ['users'] }),
    ]

    expect(
      stripBranchMergeData({
        data: {
          _branch: 'feature',
          _branchDocID: 'document-id',
          createdAt: '2026-10-01T00:00:00.000Z',
          createdBy: { relationTo: 'users', value: 'author-id' },
          id: 'storage-id',
          title: 'Merged title',
          updatedAt: '2026-10-01T01:00:00.000Z',
          updatedBy: { relationTo: 'users', value: 'author-id' },
        },
        fields,
      }),
    ).toEqual({ title: 'Merged title' })
  })

  it('should preserve custom fields that use an authorship field name', () => {
    expect(
      stripBranchMergeData({
        data: { createdBy: 'custom value', title: 'Merged title' },
        fields: [
          { name: 'createdBy', type: 'text' },
          { name: 'title', type: 'text' },
        ],
      }),
    ).toEqual({ createdBy: 'custom value', title: 'Merged title' })
  })

  it('should remove the global type from global merge data', () => {
    expect(
      stripBranchMergeGlobalData({
        data: { globalType: 'header', title: 'Merged title' },
        fields: [{ name: 'title', type: 'text' }],
      }),
    ).toEqual({ title: 'Merged title' })
  })
})
