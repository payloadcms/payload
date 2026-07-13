import { assert } from 'ts-essentials'
import { describe, it, expect } from 'vitest'
import { flattenAllFields } from './flattenAllFields.js'
import { getFieldByPath } from './getFieldByPath.js'
import type { FlattenedArrayField, FlattenedGroupField } from '../fields/config/types.js'

const fields = flattenAllFields({
  fields: [
    {
      type: 'text',
      name: 'text',
    },
    {
      type: 'text',
      name: 'textLocalized',
      localized: true,
    },
    {
      type: 'array',
      name: 'array',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
        {
          name: 'textLocalized',
          localized: true,
          type: 'text',
        },
        {
          name: 'group',
          type: 'group',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          name: 'tab',
          fields: [
            {
              type: 'array',
              name: 'localizedArray',
              localized: true,
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'blocks',
      name: 'blocks',
      blocks: [
        {
          slug: 'block1',
          fields: [
            {
              name: 'text1',
              type: 'text',
            },
          ],
        },
        {
          slug: 'block2',
          fields: [
            {
              name: 'text2',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      type: 'group',
      name: 'localizedGroup',
      localized: true,
      fields: [
        {
          name: 'text',
          type: 'text',
        },
        {
          name: 'textLocalized',
          type: 'text',
          localized: true,
        },
      ],
    },
    {
      type: 'blocks',
      name: 'localizedBlocks',
      localized: true,
      blocks: [
        {
          slug: 'block1',
          fields: [
            {
              name: 'textLocalized',
              type: 'text',
              localized: true,
            },
          ],
        },
      ],
    },
  ],
})

describe('getFieldByPath', () => {
  it('asserts getFieldByPath', () => {
    const assert_1 = getFieldByPath({ fields, path: 'text' })
    assert(assert_1)
    expect(assert_1.field).toBe(fields[0])
    expect(assert_1.pathHasLocalized).toBe(false)

    const assert_2 = getFieldByPath({ fields, path: 'textLocalized' })
    assert(assert_2)
    expect(assert_2.field).toBe(fields[1])
    expect(assert_2.pathHasLocalized).toBe(true)
    expect(assert_2.localizedPath).toBe('textLocalized.<locale>')

    const arrayField = fields[2] as FlattenedArrayField
    const assert_3 = getFieldByPath({ fields, path: 'array' })
    assert(assert_3)
    expect(assert_3.field).toBe(arrayField)
    expect(assert_3.pathHasLocalized).toBe(false)

    const assert_4 = getFieldByPath({ fields, path: 'array.text' })
    assert(assert_4)
    expect(assert_4.field).toBe(arrayField.flattenedFields[0])
    expect(assert_4.pathHasLocalized).toBe(false)

    const assert_5 = getFieldByPath({ fields, path: 'array.textLocalized' })
    assert(assert_5)
    expect(assert_5.field).toBe(arrayField.flattenedFields[1])
    expect(assert_5.pathHasLocalized).toBe(true)
    expect(assert_5.localizedPath).toBe('array.textLocalized.<locale>')

    const groupWithinArray = arrayField.flattenedFields[2] as FlattenedGroupField
    const assert_6 = getFieldByPath({ fields, path: 'array.group.text' })
    assert(assert_6)
    expect(assert_6.field).toBe(groupWithinArray.flattenedFields[0])
    expect(assert_6.pathHasLocalized).toBe(false)

    const assert_7 = getFieldByPath({ fields, path: 'tab.localizedArray.text' })
    assert(assert_7)
    expect(assert_7.field).toBe((fields[3] as any).flattenedFields[0].flattenedFields[0])
    expect(assert_7.pathHasLocalized).toBe(true)
    expect(assert_7.localizedPath).toBe('tab.localizedArray.<locale>.text')
  })

  it('gets field nested within block', () => {
    const fieldInBlock = getFieldByPath({ fields, path: 'blocks.block2.text2' })
    expect(fieldInBlock?.field).toBeDefined()

    const sourceField = (fields[4] as any).blocks?.[1].flattenedFields?.[0]
    expect(sourceField).toBeDefined()
    expect(fieldInBlock?.field).toBe(sourceField)
  })

  it('adds a <locale> segment only for the outermost localized field', () => {
    // Fields nested under a localized parent are not localized in storage
    // (see fieldShouldBeLocalized), so the localized path must contain a
    // single <locale> segment at the outermost localized field.
    const nestedPlain = getFieldByPath({ fields, path: 'localizedGroup.text' })
    assert(nestedPlain)
    expect(nestedPlain.pathHasLocalized).toBe(true)
    expect(nestedPlain.localizedPath).toBe('localizedGroup.<locale>.text')

    const nestedLocalized = getFieldByPath({ fields, path: 'localizedGroup.textLocalized' })
    assert(nestedLocalized)
    expect(nestedLocalized.pathHasLocalized).toBe(true)
    expect(nestedLocalized.localizedPath).toBe('localizedGroup.<locale>.textLocalized')
  })

  it('adds a single <locale> segment for localized fields within localized blocks', () => {
    const result = getFieldByPath({ fields, path: 'localizedBlocks.block1.textLocalized' })
    assert(result)
    expect(result.pathHasLocalized).toBe(true)
    expect(result.localizedPath).toBe('localizedBlocks.<locale>.block1.textLocalized')
  })
})
