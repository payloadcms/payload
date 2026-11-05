import type { I18nClient } from '@payloadcms/translations'
import type { ClientField } from 'payload'

import { describe, expect, it } from 'vitest'

import { getTextFieldsToBeSearched } from './getTextFieldsToBeSearched.js'

const i18n = {} as I18nClient

const namesOf = (fields: ClientField[]) =>
  fields.map((field) => ('name' in field ? field.name : undefined))

describe('getTextFieldsToBeSearched', () => {
  const fields = [
    { name: 'title', type: 'text' },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'value', type: 'text' },
        { name: 'note', type: 'text' },
      ],
    },
    {
      name: 'meta',
      type: 'group',
      fields: [{ name: 'description', type: 'text' }],
    },
  ] as ClientField[]

  it('should resolve a dotted path into an array field', () => {
    expect(namesOf(getTextFieldsToBeSearched(['items.value'], fields, i18n))).toEqual(['value'])
  })

  it('should resolve a dotted path into a group field', () => {
    expect(namesOf(getTextFieldsToBeSearched(['meta.description'], fields, i18n))).toEqual([
      'description',
    ])
  })

  it('should still match a plain top-level name', () => {
    expect(namesOf(getTextFieldsToBeSearched(['title'], fields, i18n))).toEqual(['title'])
  })

  it('should still match a group subfield by its bare name', () => {
    expect(namesOf(getTextFieldsToBeSearched(['description'], fields, i18n))).toEqual([
      'description',
    ])
  })

  it('should resolve several paths at once', () => {
    expect(namesOf(getTextFieldsToBeSearched(['title', 'items.note'], fields, i18n))).toEqual([
      'title',
      'note',
    ])
  })

  it('should not match an array subfield by its bare name, which is not a valid query path', () => {
    expect(getTextFieldsToBeSearched(['value'], fields, i18n)).toEqual([])
  })

  it('should return an empty array when nothing matches', () => {
    expect(getTextFieldsToBeSearched(['nope'], fields, i18n)).toEqual([])
  })

  it('should return null when no searchable fields are configured', () => {
    expect(getTextFieldsToBeSearched(undefined, fields, i18n)).toBeNull()
  })
})
