import React, { useEffect, useId, useState } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { TenantSelectionProviderClient, useTenantSelection } from './index.client.js'

const { router } = vi.hoisted(() => ({ router: { refresh: () => undefined } }))

vi.mock('@payloadcms/ui', () => ({
  toast: { error: vi.fn() },
  useAuth: () => ({ user: { id: 'admin' } }),
  useConfig: () => ({ config: { routes: { api: '/api' } } }),
  useRouter: () => router,
}))

const tenantOptions = [
  { label: 'Tenant A', value: 'a' },
  { label: 'Tenant B', value: 'b' },
]

afterEach(() => {
  document.cookie = 'payload-tenant=; Max-Age=-1; Path=/'
  document.cookie = 'payload-tenant-filter=; Max-Age=-1; Path=/'
})

describe('tenant browsing selection', () => {
  for (const initialValue of [undefined, 'a']) {
    test(`should preserve ${initialValue ?? 'All tenants'} while viewing a document`, async () => {
      if (initialValue) {
        document.cookie = `payload-tenant=${initialValue}; Path=/`
      }

      const screen = await render(<Fixture initialValue={initialValue} />)

      await screen.getByRole('button', { name: 'Open document' }).click()
      await expect.element(screen.getByLabelText('Selected tenant')).toHaveTextContent('b')
      expect(document.cookie.includes('payload-tenant-filter=b')).toBe(false)

      await screen.getByRole('button', { name: 'Return to list' }).click()
      await expect
        .element(screen.getByLabelText('Selected tenant'))
        .toHaveTextContent(initialValue ?? 'All tenants')
      expect(document.cookie).toContain('payload-tenant=b')

      await screen.rerender(<Fixture initialValue={initialValue} key="remounted-list" />)
      await expect
        .element(screen.getByLabelText('Selected tenant'))
        .toHaveTextContent(initialValue ?? 'All tenants')
      expect(document.cookie).toContain('payload-tenant=b')
    })
  }

  test('should show no tenant for an unassigned document despite a browsing selection', async () => {
    document.cookie = 'payload-tenant=a; Path=/'

    const screen = await render(<Fixture initialValue="a" isUnassigned />)

    await screen.getByRole('button', { name: 'Open document' }).click()
    await expect.element(screen.getByLabelText('Selected tenant')).toHaveTextContent('All tenants')
    expect(document.cookie).toContain('payload-tenant-filter=a')
  })

  test('should restore the parent document context after closing a nested drawer', async () => {
    const screen = await render(<Fixture />)

    await screen.getByRole('button', { name: 'Open document' }).click()
    await expect.element(screen.getByLabelText('Selected tenant')).toHaveTextContent('b')
    await screen.getByRole('button', { name: 'Open nested document' }).click()
    await expect.element(screen.getByLabelText('Selected tenant')).toHaveTextContent('a')
    await screen.getByRole('button', { name: 'Close nested document' }).click()
    await expect.element(screen.getByLabelText('Selected tenant')).toHaveTextContent('b')
    expect(document.cookie).not.toContain('payload-tenant-filter=b')
  })

  test('should persist an explicit selection made while viewing a global', async () => {
    const screen = await render(<Fixture isGlobal />)

    await screen.getByRole('button', { name: 'Open document' }).click()
    await expect.element(screen.getByLabelText('Selected tenant')).toHaveTextContent('b')
    expect(document.cookie).not.toContain('payload-tenant-filter=b')

    await screen.getByRole('button', { name: 'Select Tenant A' }).click()
    await screen.getByRole('button', { name: 'Return to list' }).click()
    await expect.element(screen.getByLabelText('Selected tenant')).toHaveTextContent('a')
    expect(document.cookie).toContain('payload-tenant-filter=a')
    expect(document.cookie).toContain('payload-tenant=a')
  })

  test('should update both cookies when the browsing filter is explicitly cleared', async () => {
    document.cookie = 'payload-tenant=b; Path=/'
    document.cookie = 'payload-tenant-filter=a; Path=/'

    const screen = await render(<Fixture initialValue="a" />)

    await screen.getByRole('button', { name: 'Clear tenant' }).click()
    await expect.element(screen.getByLabelText('Selected tenant')).toHaveTextContent('All tenants')
    expect(document.cookie).toContain('payload-tenant-filter=')
    expect(document.cookie).not.toContain('payload-tenant=')
  })

  test('should initialize the active tenant for an ordinary sole-tenant selection', async () => {
    await render(
      <TenantSelectionProviderClient
        initialTenantOptions={tenantOptions.slice(0, 1)}
        initialValue="a"
        tenantsCollectionSlug="tenants"
      >
        <Journey isGlobal={false} isUnassigned={false} />
      </TenantSelectionProviderClient>,
    )

    expect(document.cookie).toContain('payload-tenant=a')
    expect(document.cookie).toContain('payload-tenant-filter=a')
  })
})

function Fixture({
  initialValue,
  isGlobal = false,
  isUnassigned = false,
}: {
  initialValue?: string
  isGlobal?: boolean
  isUnassigned?: boolean
}) {
  return (
    <TenantSelectionProviderClient
      initialTenantOptions={tenantOptions}
      initialValue={initialValue}
      tenantsCollectionSlug="tenants"
    >
      <Journey isGlobal={isGlobal} isUnassigned={isUnassigned} />
    </TenantSelectionProviderClient>
  )
}

function Journey({ isGlobal, isUnassigned }: { isGlobal: boolean; isUnassigned: boolean }) {
  const [isDocumentOpen, setIsDocumentOpen] = useState(false)
  const [isNestedDocumentOpen, setIsNestedDocumentOpen] = useState(false)
  const { selectedTenantID, setTenant } = useTenantSelection()

  return (
    <>
      <output aria-label="Selected tenant">{selectedTenantID ?? 'All tenants'}</output>
      <button onClick={() => setIsDocumentOpen(true)} type="button">
        Open document
      </button>
      <button onClick={() => setIsDocumentOpen(false)} type="button">
        Return to list
      </button>
      <button onClick={() => setTenant({ id: 'a' })} type="button">
        Select Tenant A
      </button>
      <button onClick={() => setTenant({ id: undefined })} type="button">
        Clear tenant
      </button>
      <button onClick={() => setIsNestedDocumentOpen(true)} type="button">
        Open nested document
      </button>
      <button onClick={() => setIsNestedDocumentOpen(false)} type="button">
        Close nested document
      </button>
      {isNestedDocumentOpen && <DocumentScope isGlobal={false} isUnassigned={false} tenantID="a" />}
      {isDocumentOpen && <DocumentScope isGlobal={isGlobal} isUnassigned={isUnassigned} />}
    </>
  )
}

function DocumentScope({
  isGlobal,
  isUnassigned,
  tenantID = 'b',
}: {
  isGlobal: boolean
  isUnassigned: boolean
  tenantID?: string
}) {
  const { clearDocumentContext, setDocumentContext } = useTenantSelection()
  const key = useId()

  useEffect(() => {
    setDocumentContext({
      key,
      entityType: isGlobal ? 'global' : 'document',
      tenantID: isUnassigned ? undefined : tenantID,
    })

    return () => {
      clearDocumentContext({ key })
    }
  }, [clearDocumentContext, isGlobal, isUnassigned, key, setDocumentContext, tenantID])

  return null
}
