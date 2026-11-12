import React from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { TenantSelectionProviderClient, useTenantSelection } from './index.client.js'

const { refreshCookies, router } = vi.hoisted(() => {
  const refreshCookies: string[] = []

  return {
    refreshCookies,
    router: { refresh: () => refreshCookies.push(document.cookie) },
  }
})

vi.mock('@payloadcms/ui', () => ({
  toast: { error: vi.fn() },
  useAuth: () => ({ user: { id: 'admin' } }),
  useConfig: () => ({ config: { routes: { api: '/api' } } }),
  useRouter: () => router,
}))

const tenantOptions = [{ label: 'Blue Dog', value: 'blue-dog' }]

afterEach(() => {
  document.cookie = 'payload-tenant=; Max-Age=-1; Path=/'
  refreshCookies.length = 0
})

test('should clear a stale tenant cookie when access changes to all tenants', async () => {
  document.cookie = 'payload-tenant=blue-dog; Path=/'

  const screen = await render(
    <TenantSelectionProviderClient
      initialHasAccessToAllTenants={false}
      initialTenantOptions={tenantOptions}
      initialValue="blue-dog"
      tenantsCollectionSlug="tenants"
    >
      <SelectedTenant />
    </TenantSelectionProviderClient>,
  )

  await expect.element(screen.getByRole('status')).toHaveTextContent('blue-dog')
  document.cookie = 'payload-tenant=deleted-tenant; Path=/'

  await screen.rerender(
    <TenantSelectionProviderClient
      initialHasAccessToAllTenants={true}
      initialTenantOptions={tenantOptions}
      initialValue={undefined}
      tenantsCollectionSlug="tenants"
    >
      <SelectedTenant />
    </TenantSelectionProviderClient>,
  )

  await expect.element(screen.getByRole('status')).toHaveTextContent('All tenants')
  expect(document.cookie).not.toContain('payload-tenant=')
  expect(refreshCookies[0]).not.toContain('payload-tenant=blue-dog')
})

test('should keep the sole tenant selected for a restricted user with a stale cookie', async () => {
  document.cookie = 'payload-tenant=deleted-tenant; Path=/'

  const screen = await render(
    <TenantSelectionProviderClient
      initialHasAccessToAllTenants={false}
      initialTenantOptions={tenantOptions}
      initialValue={undefined}
      tenantsCollectionSlug="tenants"
    >
      <SelectedTenant />
    </TenantSelectionProviderClient>,
  )

  await expect.element(screen.getByRole('status')).toHaveTextContent('blue-dog')
  expect(document.cookie).toContain('payload-tenant=blue-dog')
})

function SelectedTenant() {
  const { selectedTenantID } = useTenantSelection()

  return <output>{selectedTenantID ?? 'All tenants'}</output>
}
