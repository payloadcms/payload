import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'

test.suite('search write errors', { config: './config.ts', db: 'mongo' }, () => {
  /* eslint-disable vitest/no-standalone-expect -- test is Payload's custom Vitest test registrar. */
  test('returns a failed search write to the caller and rolls back the parent publish', async ({
    payload,
  }) => {
    await payload.create({
      collection: 'posts',
      data: { _status: 'published', title: 'first' },
      overrideAccess: true,
    })

    await expect(
      payload.create({
        collection: 'posts',
        data: { _status: 'published', title: 'second' },
        overrideAccess: true,
      }),
    ).rejects.toThrow()

    const { docs } = await payload.find({ collection: 'posts', overrideAccess: true })
    expect(docs.map(({ title }) => title)).toEqual(['first'])
  })
  /* eslint-enable vitest/no-standalone-expect */
})
