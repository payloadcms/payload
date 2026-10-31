import { expect, it, vi } from 'vitest'

import type { AdminContext, SanitizedConfig } from 'payload'

import { createServerFunctionHandler } from './handleServerFunctions.js'

vi.mock('./serverFunctionRegistry.js', () => ({ sharedServerFunctions: {} }))

it('should initialize server actions against the originating admin URL', async () => {
  const context = { req: { branch: 'campaign' } } as AdminContext
  const initAdminContext = vi.fn().mockResolvedValue(context)
  const action = vi.fn(({ req }) => req.branch)
  const handler = createServerFunctionHandler({ initAdminContext, serverFunctions: { action } })
  const requestURL = 'http://localhost/admin/collections/posts?branch=campaign&locale=es'

  const result = await handler({
    args: {},
    config: {} as SanitizedConfig,
    importMap: {},
    name: 'action',
    requestURL,
  })

  expect(initAdminContext).toHaveBeenCalledWith(expect.objectContaining({ requestURL }))
  expect(result).toBe('campaign')
})
