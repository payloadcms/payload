'use client'

import type { OptionObject } from '@ruya.sa/payload'

import { toast, useAuth, useConfig } from '@ruya.sa/ui'
import { useRouter } from 'next/navigation.js'
import { formatAdminURL } from '@ruya.sa/payload/shared'
import React, { createContext } from 'react'

import { generateCookie } from '../../utilities/generateCookie.js'

type ContextType = {
  /**
   * What is the context of the selector? It is either 'document' | 'global' | undefined.
   *
   * - 'document' means you are viewing a document in the context of a tenant
   * - 'global' means you are viewing a "global" (globals are collection documents but prevent you from viewing the list view) document in the context of a tenant
   * - undefined means you are not viewing a document at all
   */
  entityType?: 'document' | 'global'
  /**
   * Hoists the forms modified state
   */
  modified?: boolean
  /**
   * Array of options to select from
   */
  options: OptionObject[]
  /**
   * The currently selected tenant ID
   */
  selectedTenantID: number | string | undefined
  /**
   * Sets the entityType when a document is loaded and sets it to undefined when the document unmounts.
   */
  setEntityType: React.Dispatch<React.SetStateAction<'document' | 'global' | undefined>>
  /**
   * Sets the modified state
   */
  setModified: React.Dispatch<React.SetStateAction<boolean>>
  /**
   * Sets the selected tenant ID
   *
   * @param args.id - The ID of the tenant to select
   * @param args.refresh - Whether to refresh the page after changing the tenant
   */
  setTenant: (args: { id: number | string | undefined; refresh?: boolean }) => void
  /**
   * Used to sync tenants displayed in the tenant selector when updates are made to the tenants collection.
   */
  syncTenants: () => Promise<void>
  /**
   *
   */
  updateTenants: (args: { id: number | string; label: string }) => void
}

const Context = createContext<ContextType>({
  entityType: undefined,
  options: [],
  selectedTenantID: undefined,
  setEntityType: () => undefined,
  setModified: () => undefined,
  setTenant: () => null,
  syncTenants: () => Promise.resolve(),
  updateTenants: () => null,
})

const DEFAULT_COOKIE_NAME = 'payload-tenant'

const setTenantCookie = (args: { cookieName?: string; value: string }) => {
  const { cookieName = DEFAULT_COOKIE_NAME, value } = args
  document.cookie = generateCookie<string>({
    name: cookieName,
    maxAge: 60 * 60 * 24 * 365, // 1 year in seconds
    path: '/',
    returnCookieAsObject: false,
    value: value || '',
  })
}

const deleteTenantCookie = (args: { cookieName?: string } = {}) => {
  const { cookieName = DEFAULT_COOKIE_NAME } = args
  document.cookie = generateCookie<string>({
    name: cookieName,
    maxAge: -1,
    path: '/',
    returnCookieAsObject: false,
    value: '',
  })
}

const getTenantCookie = (args: { cookieName?: string } = {}): string | undefined => {
  const { cookieName = DEFAULT_COOKIE_NAME } = args
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${cookieName}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift()
  }
  return undefined
}

export const TenantSelectionProviderClient = ({
  children,
  initialTenantOptions,
  initialValue,
  tenantsCollectionSlug,
}: {
  children: React.ReactNode
  initialTenantOptions: OptionObject[]
  initialValue?: number | string
  tenantsCollectionSlug: string
}) => {
  const [selectedTenantID, setSelectedTenantID] = React.useState<number | string | undefined>(
    initialValue,
  )
  const [modified, setModified] = React.useState<boolean>(false)
  const [entityType, setEntityType] = React.useState<'document' | 'global' | undefined>(undefined)
  const { user } = useAuth()
  const { config } = useConfig()
  const router = useRouter()
  const userID = React.useMemo(() => user?.id, [user?.id])
  const prevUserID = React.useRef(userID)
  const userChanged = userID !== prevUserID.current
  const [tenantOptions, setTenantOptions] = React.useState<OptionObject[]>(
    () => initialTenantOptions,
  )
  const selectedTenantLabel = React.useMemo(
    () => tenantOptions.find((option) => option.value === selectedTenantID)?.label,
    [selectedTenantID, tenantOptions],
  )

  const setTenantAndCookie = React.useCallback(
    ({ id, refresh }: { id: number | string | undefined; refresh?: boolean }) => {
      setSelectedTenantID(id)
      if (id !== undefined) {
        setTenantCookie({ value: String(id) })
      } else {
        deleteTenantCookie()
      }
      if (refresh) {
        router.refresh()
      }
    },
    [router],
  )

  const setTenant = React.useCallback<ContextType['setTenant']>(
    ({ id, refresh }) => {
      if (id === undefined) {
        if (tenantOptions.length > 1 || tenantOptions.length === 0) {
          // users with multiple tenants can clear the tenant selection
          setTenantAndCookie({ id: undefined, refresh })
        } else if (tenantOptions[0]) {
          // if there is only one tenant, auto-select that tenant
          setTenantAndCookie({ id: tenantOptions[0].value, refresh: true })
        }
      } else if (!tenantOptions.find((option) => option.value === id)) {
        // if the tenant is invalid, set the first tenant as selected
        setTenantAndCookie({
          id: tenantOptions[0]?.value,
          refresh,
        })
      } else {
        // if the tenant is in the options, set it as selected
        setTenantAndCookie({ id, refresh })
      }
    },
    [tenantOptions, setTenantAndCookie],
  )

  const syncTenants = React.useCallback(async () => {
    try {
      const req = await fetch(
        formatAdminURL({
          apiRoute: config.routes.api,
          path: `/${tenantsCollectionSlug}/populate-tenant-options`,
        }),
        {
          credentials: 'include',
          method: 'GET',
        },
      )

      const result = await req.json()

      if (result.tenantOptions && userID) {
        setTenantOptions(result.tenantOptions)

        if (result.tenantOptions.length === 1) {
          setSelectedTenantID(result.tenantOptions[0].value)
          setTenantCookie({ value: String(result.tenantOptions[0].value) })
        }
      }
    } catch (e) {
      toast.error(`Error fetching tenants`)
    }
  }, [config.routes.api, tenantsCollectionSlug, userID])

  const updateTenants = React.useCallback<ContextType['updateTenants']>(
    ({ id, label }) => {
      setTenantOptions((prev) => {
        return prev.map((currentTenant) => {
          if (id === currentTenant.value) {
            return {
              label,
              value: id,
            }
          }
          return currentTenant
        })
      })

      void syncTenants()
    },
    [syncTenants],
  )

  React.useEffect(() => {
    if (userChanged || (initialValue && String(initialValue) !== getTenantCookie())) {
      if (userID) {
        // user logging in
        void syncTenants()
      } else {
        // user logging out
        setSelectedTenantID(undefined)
        deleteTenantCookie()
        if (tenantOptions.length > 0) {
          setTenantOptions([])
        }
        router.refresh()
      }
      prevUserID.current = userID
    }
  }, [userID, userChanged, syncTenants, tenantOptions, initialValue, router])

  /**
   * If there is no initial value, clear the tenant and refresh the router.
   * Needed for stale tenantIDs set as a cookie.
   */
  React.useEffect(() => {
    if (!initialValue) {
      setTenant({ id: undefined, refresh: true })
    }
  }, [initialValue, setTenant])

  /**
   * If there is no selected tenant ID and the entity type is 'global', set the first tenant as selected.
   * This ensures that the global tenant is always set when the component mounts.
   */
  React.useEffect(() => {
    if (!selectedTenantID && tenantOptions.length > 0 && entityType === 'global') {
      setTenant({
        id: tenantOptions[0]?.value,
        refresh: true,
      })
    }
  }, [selectedTenantID, tenantOptions, entityType, setTenant])

  return (
    <span
      data-selected-tenant-id={selectedTenantID}
      data-selected-tenant-title={selectedTenantLabel}
    >
      <Context
        value={{
          entityType,
          modified,
          options: tenantOptions,
          selectedTenantID,
          setEntityType,
          setModified,
          setTenant,
          syncTenants,
          updateTenants,
        }}
      >
        {children}
      </Context>
    </span>
  )
}

export const useTenantSelection = () => React.use(Context)
