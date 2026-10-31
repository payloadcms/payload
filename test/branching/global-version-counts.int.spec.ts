import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { homepageGlobalSlug } from './shared.js'

const branch = 'halloween-updates'

test.suite('Branching: global version counts', { config: './config.ts' }, () => {
  test('should scope global version counts to the selected branch', async ({ payload }) => {
    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      data: { heroTitle: 'Main published', _status: 'published' },
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      branch,
      data: { heroTitle: 'First branch draft' },
      draft: true,
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      branch,
      data: { heroTitle: 'Second branch draft' },
      draft: true,
      overrideAccess: true,
    })

    for (const selectedBranch of ['main', branch, false] as const) {
      const expected = await payload.findGlobalVersions({
        slug: homepageGlobalSlug,
        branch: selectedBranch,
        limit: 1,
        overrideAccess: true,
      })
      const localCount = await payload.countGlobalVersions({
        branch: selectedBranch,
        global: homepageGlobalSlug,
        overrideAccess: true,
      })
      const adapterCount = await payload.db.countGlobalVersions({
        branch: selectedBranch,
        global: homepageGlobalSlug,
        req: await createPayloadRequest({ payload }),
      })
      const req = await createPayloadRequest({ branch: selectedBranch, payload })
      const inheritedCount = await payload.db.countGlobalVersions({
        global: homepageGlobalSlug,
        req,
      })

      expect(expected.totalDocs).toBe(
        selectedBranch === false ? 3 : selectedBranch === 'main' ? 1 : 2,
      )
      expect(localCount.totalDocs).toBe(expected.totalDocs)
      expect(adapterCount.totalDocs).toBe(expected.totalDocs)
      expect(inheritedCount.totalDocs).toBe(expected.totalDocs)
    }
  })
})
