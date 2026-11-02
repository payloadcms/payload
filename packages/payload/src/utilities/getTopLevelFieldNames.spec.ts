import { describe, expect, it } from 'vitest'

import { getTopLevelFieldNames } from './getTopLevelFieldNames.js'

describe('getTopLevelFieldNames', () => {
  it('should return unique top-level names from direct and dotted field paths', () => {
    expect(
      getTopLevelFieldNames({
        'blocks.0.heading': 'Heading',
        'group.description': 'Description',
        'group.title': 'Title',
        slug: 'example',
      }),
    ).toEqual(new Set(['blocks', 'group', 'slug']))
  })
})
