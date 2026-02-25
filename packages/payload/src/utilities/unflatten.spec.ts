import { describe, expect, it } from 'vitest'

import { unflatten } from './unflatten.js'

describe('unflatten', () => {
  it('should not mutate input values that are objects', () => {
    const lexicalJSON = { root: { children: [{ type: 'block', id: 'abc' }] } }

    const input = {
      richText: lexicalJSON,
      'richText.abc.id': 'abc',
      'richText.abc.blockType': 'blockWithArray',
      'richText.abc.items.0.id': 'row1',
    }

    const output = unflatten(input)

    expect(output).toEqual({
      richText: {
        abc: {
          id: 'abc',
          blockType: 'blockWithArray',
          items: [
            {
              id: 'row1',
            },
          ],
        },
        root: { children: [{ type: 'block', id: 'abc' }] },
      },
    })
    expect(lexicalJSON).toEqual({ root: { children: [{ type: 'block', id: 'abc' }] } })
  })
})
