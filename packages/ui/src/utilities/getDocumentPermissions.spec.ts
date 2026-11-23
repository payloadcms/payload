import type { PayloadRequest, SanitizedGlobalConfig } from 'payload'

import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  docAccessOperationGlobal: vi.fn(),
}))

vi.mock('payload', async (importOriginal) => {
  const payload = await importOriginal<typeof import('payload')>()

  return {
    ...payload,
    docAccessOperationGlobal: mocks.docAccessOperationGlobal,
  }
})

import { getDocumentPermissions } from './getDocumentPermissions.js'

describe('getDocumentPermissions', () => {
  it('should let a user who may only save drafts edit a published global', async () => {
    mocks.docAccessOperationGlobal.mockImplementation(({ data }) =>
      Promise.resolve({ fields: {}, read: true, update: data._status !== 'published' }),
    )

    const result = await getDocumentPermissions({
      data: { _status: 'published', title: 'Settings' },
      globalConfig: {
        slug: 'settings',
        versions: { drafts: true },
      } as unknown as SanitizedGlobalConfig,
      req: {} as PayloadRequest,
    })

    expect(result.hasSavePermission).toBe(true)
    expect(result.hasPublishPermission).toBe(false)
  })
})
