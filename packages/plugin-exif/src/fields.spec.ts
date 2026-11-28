import { describe, expect, it } from 'vitest'

import { buildExifFields } from './fields.js'

describe('buildExifFields', () => {
  it('should position the group in the sidebar and render it with the ExifProperties component', () => {
    const [group] = buildExifFields('exif')

    expect(group).toMatchObject({
      name: 'exif',
      type: 'group',
      admin: { position: 'sidebar' },
    })
    // narrow to read the component config
    const field = group.type === 'group' ? group.admin?.components?.Field : undefined
    expect(field).toMatchObject({
      clientProps: { fieldName: 'exif' },
      path: '@payloadcms/plugin-exif/client#ExifProperties',
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
    const field = group.type === 'group' ? group.admin?.components?.Field : undefined
    expect(field).toMatchObject({ clientProps: { fieldName: 'metadata' } })
  })
})
