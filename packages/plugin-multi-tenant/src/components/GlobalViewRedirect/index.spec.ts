import type { Config, Payload } from 'payload'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getGlobalViewRedirect: vi.fn(),
  headers: vi.fn(),
  redirect: vi.fn(),
}))

vi.mock('next/headers.js', () => ({
  headers: mocks.headers,
}))

vi.mock('next/navigation.js', () => ({
  redirect: mocks.redirect,
}))

vi.mock('../../utilities/getGlobalViewRedirect.js', () => ({
  getGlobalViewRedirect: mocks.getGlobalViewRedirect,
}))

import { multiTenantPlugin } from '../../index.js'
import { GlobalViewRedirect } from './index.js'

type GlobalViewRedirectArgs = Parameters<typeof GlobalViewRedirect>[0]

const getRegisteredServerProps = (pluginConfig: Parameters<typeof multiTenantPlugin>[0]) => {
  const config = multiTenantPlugin(pluginConfig)({
    admin: { user: 'users' },
    collections: [
      { slug: 'users', auth: true, fields: [] },
      { slug: 'tenants', fields: [{ name: 'name', type: 'text' }] },
      { slug: 'settings', fields: [{ name: 'title', type: 'text' }] },
    ],
  } as unknown as Config)

  const action = config.admin?.components?.actions?.find(
    (component) =>
      typeof component === 'object' &&
      component.path === '@payloadcms/plugin-multi-tenant/rsc#GlobalViewRedirect',
  )

  if (!action || typeof action !== 'object') {
    throw new Error('GlobalViewRedirect action is not registered')
  }

  return action.serverProps as Partial<GlobalViewRedirectArgs>
}

describe('GlobalViewRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.headers.mockResolvedValue(new Headers())
  })

  it('should pass the registered tenants array field names to getGlobalViewRedirect', async () => {
    const serverProps = getRegisteredServerProps({
      collections: { settings: { isGlobal: true } },
      tenantsArrayField: {
        arrayFieldName: 'memberships',
        arrayTenantFieldName: 'site',
      },
    })

    await GlobalViewRedirect({
      ...serverProps,
      collectionSlug: 'settings',
      payload: {} as Payload,
      viewType: 'list',
    } as GlobalViewRedirectArgs)

    expect(mocks.getGlobalViewRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantsArrayFieldName: 'memberships',
        tenantsArrayTenantFieldName: 'site',
      }),
    )
  })
})
