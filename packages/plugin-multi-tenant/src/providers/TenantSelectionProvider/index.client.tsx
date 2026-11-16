'use client'

import type { OptionObject } from 'payload'

import { toast, useAuth, useConfig, useRouter } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import React, { createContext } from 'react'

import { generateCookie } from '../../utilities/generateCookie.js'
import { shouldRefreshTenantSelection } from '../../utilities/shouldRefreshTenantSelection.js'

type DocumentContext = {
  entityType: 'document' | 'global'
  key: string
  tenantID: number | string | undefined
}

type ContextType = {
  /** The persistent tenant filter used outside document views. */
  browsingTenantID: number | string | undefined
  /** Removes only the closing document or drawer from the active context. */
  clearDocumentContext: (args: { key: string }) => void
  /**
   * What is the context of the selector? It is either 'document' | 'global' | undefined.
   *
   * - 'document' means you are viewing a document in the context of a tenant
   * - 'global' means you are viewing a "global" (globals are collection documents with one document per tenant) document in the context of a tenant
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
   * The effective tenant for the current document or browsing view
   */
  selectedTenantID: number | string | undefined
  /** Updates document context without changing the browsing filter or cookie. */
  setDocumentContext: (args: DocumentContext) => void
  /**
   * Sets the entityType when a document is loaded and sets it to undefined when the document unmounts.
   */
  setEntityType: React.Dispatch<React.SetStateAction<'document' | 'global' | undefined>>
  /**
   * Sets the modified state
   */
  setModified: React.Dispatch<React.SetStateAction<boolean>>
  /**
   * Sets the persistent browsing tenant ID
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
  browsingTenantID: undefined,
  clearDocumentContext: () => undefined,
  entityType: undefined,
  options: [],
  selectedTenantID: undefined,
  setDocumentContext: () => undefined,
  setEntityType: () => undefined,
  setModified: () => undefined,
  setTenant: () => null,
  syncTenants: () => Promise.resolve(),
  updateTenants: () => null,
})

const DEFAULT_COOKIE_NAME = 'payload-tenant-filter'

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
  return cookieName === DEFAULT_COOKIE_NAME
    ? getTenantCookie({ cookieName: 'payload-tenant' })
    : undefined
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
  const [browsingTenantID, setSelectedTenantID] = React.useState<number | string | undefined>(
    initialValue,
  )
  const [documentContexts, setDocumentContexts] = React.useState<DocumentContext[]>([])
  const [modified, setModified] = React.useState<boolean>(false)
  const [legacyEntityType, setEntityType] = React.useState<'document' | 'global' | undefined>(
    undefined,
  )
  const documentContext = documentContexts[documentContexts.length - 1]
  const hasDocumentContext = documentContext !== undefined
  const documentTenantID = documentContext?.tenantID
  const entityType = documentContext?.entityType ?? legacyEntityType
  const selectedTenantID = documentContext ? documentContext.tenantID : browsingTenantID

  const setDocumentContext = React.useCallback<ContextType['setDocumentContext']>((context) => {
    setDocumentContexts((previous) => {
      const index = previous.findIndex(({ key }) => key === context.key)

      if (index === -1) {
        return [...previous, context]
      }

      return previous.map((entry, entryIndex) => (entryIndex === index ? context : entry))
    })
  }, [])

  const clearDocumentContext = React.useCallback<ContextType['clearDocumentContext']>(({ key }) => {
    setDocumentContexts((previous) => previous.filter((entry) => entry.key !== key))
  }, [])
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

  React.useEffect(() => {
    setTenantCookie({ value: browsingTenantID === undefined ? '' : String(browsingTenantID) })
  }, [browsingTenantID])

  React.useEffect(() => {
    if (!hasDocumentContext) {
      return
    }

    if (documentTenantID === undefined) {
      deleteTenantCookie({ cookieName: 'payload-tenant' })
    } else {
      setTenantCookie({ cookieName: 'payload-tenant', value: String(documentTenantID) })
    }
  }, [documentTenantID, hasDocumentContext])

  const setTenantAndCookie = React.useCallback(
    ({ id, refresh }: { id: number | string | undefined; refresh?: boolean }) => {
      setSelectedTenantID(id)
      if (id !== undefined) {
        setTenantCookie({ value: String(id) })
      } else {
        setTenantCookie({ value: '' })
      }
      if (id !== undefined) {
        setTenantCookie({ cookieName: 'payload-tenant', value: String(id) })
      } else {
        deleteTenantCookie({ cookieName: 'payload-tenant' })
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
          setTenantCookie({
            cookieName: 'payload-tenant',
            value: String(result.tenantOptions[0].value),
          })
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

  /**
   * Sync server-provided tenant options into client state.
   * When the server component re-renders (e.g., after navigation post-login),
   * it provides updated initialTenantOptions. Since useState() ignores new
   * initial values on re-renders, and re-initializes with stale props on
   * remounts, we sync them explicitly via this effect.
   */
  React.useEffect(() => {
    if (initialTenantOptions.length > 0) {
      setTenantOptions((prev) => {
        if (
          prev.length === initialTenantOptions.length &&
          prev.every((opt, i) => opt.value === initialTenantOptions[i]?.value)
        ) {
          return prev
        }
        return initialTenantOptions
      })

      if (initialTenantOptions.length === 1 && initialTenantOptions[0]) {
        setSelectedTenantID(initialTenantOptions[0].value)
        setTenantCookie({ value: String(initialTenantOptions[0].value) })
        setTenantCookie({
          cookieName: 'payload-tenant',
          value: String(initialTenantOptions[0].value),
        })
      }
    }
  }, [initialTenantOptions])

  React.useEffect(() => {
    const hasTenantSelectionMismatch = initialValue && String(initialValue) !== getTenantCookie()

    if (userID && (userChanged || tenantOptions.length === 0 || hasTenantSelectionMismatch)) {
      // Sync on login, and when the provider remounts after login without tenant options.
      void syncTenants()
    } else if (!userID && (userChanged || hasTenantSelectionMismatch)) {
      // user logging out
      setSelectedTenantID(undefined)
      deleteTenantCookie()
      deleteTenantCookie({ cookieName: 'payload-tenant' })
      setTenantOptions((prev) => (prev.length > 0 ? [] : prev))
      router.refresh()
    }

    if (userChanged) {
      prevUserID.current = userID
    }
  }, [userID, userChanged, syncTenants, initialValue, router, tenantOptions.length])

  /**
   * Populate tenant options when the provider mounts already-authenticated but
   * without server-provided options. This happens when a provider setup remounts
   * this subtree on login (see `config.conditionalProvider`): the remounted
   * instance initializes `prevUserID` to the current user, so `userChanged` above
   * is `false` and never fires `syncTenants`, while the server still rendered the
   * logged-out tree so `initialTenantOptions` is empty — leaving the selector
   * unrendered. Unlike `router.refresh()`, `syncTenants()` is a plain client fetch
   * that cannot trigger a remount loop, so this is safe on every framework adapter.
   */
  const didInitialSync = React.useRef(false)
  React.useEffect(() => {
    if (
      !didInitialSync.current &&
      !userChanged &&
      userID &&
      tenantOptions.length === 0 &&
      initialTenantOptions.length === 0
    ) {
      didInitialSync.current = true
      void syncTenants()
    }
  }, [userChanged, userID, tenantOptions.length, initialTenantOptions, syncTenants])

  /**
   * If there is no initial value and a stale tenant cookie exists, clear the
   * tenant and refresh the router.
   */
  React.useEffect(() => {
    if (
      shouldRefreshTenantSelection({
        initialValue,
        tenantCookie: getTenantCookie(),
      })
    ) {
      setTenant({ id: undefined, refresh: true })
    }
  }, [initialValue, setTenant])

  return (
    <span
      data-selected-tenant-id={selectedTenantID}
      data-selected-tenant-title={selectedTenantLabel}
    >
      <Context
        value={{
          browsingTenantID,
          clearDocumentContext,
          entityType,
          modified,
          options: tenantOptions,
          selectedTenantID,
          setDocumentContext,
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
