import { describe, expect, it } from 'vitest'

import { prefixWherePaths } from './prefixWherePaths.js'

describe('prefixWherePaths', () => {
  it('prefixes field paths while preserving nested logical operators', () => {
    expect(
      prefixWherePaths({
        prefix: 'client',
        where: {
          OR: [
            {
              status: {
                equals: 'active',
              },
            },
            {
              and: [
                {
                  region: {
                    equals: 'emea',
                  },
                },
              ],
            },
          ],
        },
      }),
    ).toEqual({
      OR: [
        {
          'client.status': {
            equals: 'active',
          },
        },
        {
          and: [
            {
              'client.region': {
                equals: 'emea',
              },
            },
          ],
        },
      ],
    })
  })
})
