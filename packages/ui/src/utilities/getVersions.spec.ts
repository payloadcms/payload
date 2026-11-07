import { describe, expect, it, vi } from 'vitest'

import { getVersions } from './getVersions.js'

describe('getVersions', () => {
  it('checks global published status when fetching a selected global', async () => {
    const payload = {
      config: {},
      countGlobalVersions: vi.fn().mockResolvedValue({ totalDocs: 2 }),
      findGlobal: vi.fn(async ({ select }) => ({
        ...(select?._status ? { _status: 'published' } : {}),
        updatedAt: '2026-07-01T00:00:00.000Z',
      })),
      findGlobalVersions: vi.fn().mockResolvedValue({ docs: [{ autosave: true }] }),
    }

    const result = await getVersions({
      doc: { _status: 'draft' },
      docPermissions: { readVersions: true } as any,
      globalConfig: {
        fields: [],
        slug: 'site-settings',
        versions: {
          drafts: {
            autosave: true,
          },
        },
      } as any,
      payload: payload as any,
      user: {} as any,
    })

    expect(payload.findGlobal).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          _status: true,
          updatedAt: true,
        }),
      }),
    )
    expect(result.hasPublishedDoc).to.equal(true)
  })
})
