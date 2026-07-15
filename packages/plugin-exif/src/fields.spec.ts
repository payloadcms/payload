import { describe, expect, it } from 'vitest'

import { buildExifFields } from './fields.js'

describe('buildExifFields', () => {
  it('should build a readOnly group under the given field name', () => {
    const [group] = buildExifFields('exif')

    expect(group).toMatchObject({
      admin: { readOnly: true },
      name: 'exif',
      type: 'group',
    })
  })

  it('should include a raw json field and the promoted fields in order', () => {
    const [group] = buildExifFields('exif')
    const names =
      group.type === 'group'
        ? group.fields.map((field) => ('name' in field ? field.name : undefined))
        : []

    expect(names).toEqual(['raw', 'takenAt', 'location'])
  })

  it('should honor a custom field name', () => {
    const [group] = buildExifFields('metadata')

    expect('name' in group && group.name).toBe('metadata')
  })
})
