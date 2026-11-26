import type { Access, Config } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it } from 'vitest'

import { addDefaultsToConfig, defaults } from '../config/defaults.js'
import { getJobStatsGlobal } from '../queues/config/global.js'

const createRequest = (collection?: string): PayloadRequest =>
  ({
    payload: {
      config: {
        admin: {
          user: 'admins',
        },
      },
    },
    user: collection ? { collection } : undefined,
  }) as PayloadRequest

const expectAdminCollectionAccess = async (access: Access | undefined) => {
  expect(access).toBeDefined()
  expect(await access!({ req: createRequest('admins') } as never)).toBe(true)
  expect(await access!({ req: createRequest('customers') } as never)).toBe(false)
  expect(await access!({ req: createRequest() } as never)).toBe(false)
}

describe('admin panel user access consumers', () => {
  it('should scope job action defaults to the admin auth collection', async () => {
    const sanitizedConfig = addDefaultsToConfig({} as Config)

    for (const jobs of [defaults.jobs, sanitizedConfig.jobs]) {
      await expectAdminCollectionAccess(jobs?.access?.cancel)
      await expectAdminCollectionAccess(jobs?.access?.queue)
      await expectAdminCollectionAccess(jobs?.access?.run)
    }
  })

  it('should scope job stats access to the admin auth collection', async () => {
    const jobStats = getJobStatsGlobal({} as Config)

    await expectAdminCollectionAccess(jobStats.access?.read)
    await expectAdminCollectionAccess(jobStats.access?.update)
  })
})
