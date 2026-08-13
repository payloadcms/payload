import type { CollectionToolHandlerArgs } from '../../../types.js'

import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../utils/getLogger.js', () => ({
  getLogger: () => ({ error: vi.fn() }),
}))

import {
  forgotPasswordCollectionTool,
  loginCollectionTool,
  resetPasswordCollectionTool,
  unlockCollectionTool,
} from './authTools.js'

const cases = [
  {
    input: { disableEmail: true, email: 'test@example.com' },
    method: 'forgotPassword',
    tool: forgotPasswordCollectionTool,
  },
  {
    input: { depth: 0, email: 'test@example.com', password: 'password', showHiddenFields: false },
    method: 'login',
    tool: loginCollectionTool,
  },
  {
    input: { password: 'password', token: 'token' },
    method: 'resetPassword',
    tool: resetPasswordCollectionTool,
  },
  {
    input: { email: 'test@example.com' },
    method: 'unlock',
    tool: unlockCollectionTool,
  },
] as const

describe('auth collection tools', () => {
  it.each([false, true])(
    'should pass authorizedMCP.overrideAccess=%s to Local API calls',
    async (overrideAccess) => {
      for (const { input, method, tool } of cases) {
        const localAPICall = vi.fn().mockResolvedValue({})
        const args = {
          authorizedMCP: { items: [], overrideAccess },
          collectionSlug: 'users',
          input,
          req: {
            payload: {
              [method]: localAPICall,
            },
          },
          serverContext: {},
        } as unknown as CollectionToolHandlerArgs

        await tool.handler(args)

        expect(localAPICall).toHaveBeenCalledWith(expect.objectContaining({ overrideAccess }))
      }
    },
  )
})
