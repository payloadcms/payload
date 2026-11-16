import type { PayloadRequest } from 'payload'

import { expect, test, vi } from 'vitest'

import { getNavPrefs } from './getNavPrefs.js'

test.each([undefined, 'document-transaction'])(
  'should read navigation preferences outside a concurrent document transaction (%s)',
  async (transactionID) => {
    const transactions: PayloadRequest['transactionID'][] = []
    const find = vi.fn(async ({ req: preferencesReq }: { req: PayloadRequest }) => {
      transactions.push(preferencesReq.transactionID)
      req.transactionID = 'document-transaction'

      return { docs: [{ value: { activeTab: 'folders', groups: { Content: true }, open: false } }] }
    })
    const req = {
      payload: { find },
      transactionID,
      user: { id: 'user-id', collection: 'users' },
    } as unknown as PayloadRequest

    const preferences = await getNavPrefs(req)

    expect(transactions).toEqual([undefined, undefined])
    expect(req.transactionID).toBe('document-transaction')
    expect(preferences).toEqual({
      activeTab: 'folders',
      groups: { Content: true },
      open: false,
    })
  },
)
