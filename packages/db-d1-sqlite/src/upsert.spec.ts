import type { Payload } from 'payload'

import { expect, it, vi } from 'vitest'

import type { Args } from './types.js'

import { sqliteD1Adapter } from './index.js'

it('should enable insertion when calling D1 upsert', async () => {
  const adapter = sqliteD1Adapter({ binding: {} as Args['binding'] }).init({
    payload: {} as Payload,
  })
  const document = { id: 1, key: 'nav' }
  const updateOne = vi.spyOn(adapter, 'updateOne').mockResolvedValue(document)
  const args = {
    collection: 'payload-preferences',
    data: { key: 'nav' },
    where: { key: { equals: 'nav' } },
  }

  await expect(adapter.upsert(args)).resolves.toEqual(document)
  expect(updateOne).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ ...args, options: { upsert: true } }),
  )
})
