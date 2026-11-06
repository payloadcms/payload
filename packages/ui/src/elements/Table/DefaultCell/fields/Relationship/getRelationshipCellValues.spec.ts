import { describe, expect, it } from 'vitest'

import { getRelationshipCellValues } from './getRelationshipCellValues.js'

describe('relationship table values', () => {
  it('should resolve the media ID from a populated avatar', () => {
    expect(
      getRelationshipCellValues({
        cellData: { id: 'avatar-1', filename: 'tylan.png', url: '/media/tylan.png' },
        relationTo: 'media',
      }),
    ).toEqual([{ relationTo: 'media', value: 'avatar-1' }])
  })

  it('should resolve the user ID from populated polymorphic authorship fields', () => {
    expect(
      getRelationshipCellValues({
        cellData: { relationTo: 'users', value: { id: 'tylan', email: 'tylan@payloadcms.com' } },
        relationTo: ['users', 'editors'],
      }),
    ).toEqual([{ relationTo: 'users', value: 'tylan' }])
  })

  it('should accept populated and unpopulated has-many relationships', () => {
    expect(
      getRelationshipCellValues({
        cellData: [{ id: 'first' }, 'second', { id: 0 }, 'fourth'],
        relationTo: 'media',
      }),
    ).toEqual([
      { relationTo: 'media', value: 'first' },
      { relationTo: 'media', value: 'second' },
      { relationTo: 'media', value: 0 },
    ])
  })

  it('should retain unpopulated polymorphic IDs', () => {
    expect(
      getRelationshipCellValues({
        cellData: [
          { relationTo: 'users', value: '1' },
          { relationTo: 'editors', value: 2 },
        ],
        relationTo: ['users', 'editors'],
      }),
    ).toEqual([
      { relationTo: 'users', value: '1' },
      { relationTo: 'editors', value: 2 },
    ])
  })

  it('should ignore empty or malformed relationship values', () => {
    expect(
      getRelationshipCellValues({
        cellData: [null, {}, { relationTo: 'users', value: {} }],
        relationTo: 'media',
      }),
    ).toEqual([])
    expect(
      getRelationshipCellValues({ cellData: { id: '1' }, relationTo: ['users', 'editors'] }),
    ).toEqual([])
  })
})
