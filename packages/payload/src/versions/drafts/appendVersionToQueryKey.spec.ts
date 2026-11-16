import { describe, expect, it } from 'vitest'

import { appendVersionToQueryKey } from './appendVersionToQueryKey.js'

describe('appendVersionToQueryKey', () => {
  it.each(['aNd', 'oR'])(
    'should preserve case-insensitive %s conditions when prefixing version fields',
    (logicalOperator) => {
      expect(
        appendVersionToQueryKey({
          [logicalOperator]: [
            {
              title: {
                equals: 'example',
              },
            },
          ],
        }),
      ).toStrictEqual({
        [logicalOperator.toLowerCase()]: [
          {
            'version.title': {
              equals: 'example',
            },
          },
        ],
      })
    },
  )
})
