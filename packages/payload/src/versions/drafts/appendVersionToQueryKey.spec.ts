import { describe, expect, it } from 'vitest'

import {
  appendGlobalVersionToQueryKey,
  appendVersionToQueryKey,
} from './appendVersionToQueryKey.js'

describe('appendVersionToQueryKey', () => {
  it.each(['aNd', 'oR'])(
    'preserves case-insensitive %s conditions when prefixing version fields',
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

  it('should map collection IDs to the version parent', () => {
    expect(
      appendVersionToQueryKey({
        id: {
          equals: 'example',
        },
      }),
    ).toStrictEqual({
      parent: {
        equals: 'example',
      },
    })
  })

  it('should reject global ID constraints without treating the ID as a version field', () => {
    expect(
      appendGlobalVersionToQueryKey({
        or: [
          {
            id: {
              equals: 'example',
            },
          },
          {
            title: {
              equals: 'allowed',
            },
          },
        ],
      }),
    ).toStrictEqual({
      or: [
        {
          id: {
            exists: false,
          },
        },
        {
          'version.title': {
            equals: 'allowed',
          },
        },
      ],
    })
  })
})
