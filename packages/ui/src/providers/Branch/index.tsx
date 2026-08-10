'use client'

import { branchesCollectionSlug, MAIN_BRANCH, PREFERENCE_KEYS } from 'payload/shared'
import React, { createContext, use, useCallback, useEffect, useState } from 'react'

import { useConfig } from '../Config/index.js'
import { useDocumentEvents } from '../DocumentEvents/index.js'
import { usePreferences } from '../Preferences/index.js'
import { useRouter } from '../RouterAdapter/index.js'
import { useRouteTransition } from '../RouteTransition/index.js'

export type BranchOption = {
  name: string
  slug: string
}

export type BranchContext = {
  /** Slug of the branch every read on this request resolved through. */
  activeBranch: string
  /** Branches the user can read, excluding `main`. */
  branches: BranchOption[]
  /** Whether branching is enabled for this Payload instance. */
  isEnabled: boolean
  /**
   * Switches the active branch: stores the choice in the user's preferences and
   * re-renders the current view against it.
   */
  setBranch: (slug: string, options?: { refresh?: boolean }) => void
}

const Context = createContext<BranchContext>({
  activeBranch: MAIN_BRANCH,
  branches: [],
  isEnabled: false,
  setBranch: () => null,
})

export type BranchProviderProps = {
  /** Branch resolved for the request that rendered this page. */
  activeBranch: string
  branches: BranchOption[]
  children: React.ReactNode
  /**
   * Set when the request resolved to a branch the user can no longer see, so
   * the stored preference pointing at it can be cleared.
   */
  staleBranch?: null | string
}

/**
 * Holds the active branch for the admin UI.
 *
 * The selection lives in the user's `branch` preference and nowhere else, so it
 * follows them between browsers and machines. The server resolves it during
 * request initialization, which is why switching is a preference write followed
 * by a refresh rather than any client-side state that has to be kept in sync.
 */
export const BranchProvider: React.FC<BranchProviderProps> = ({
  activeBranch: activeBranchFromServer,
  branches,
  children,
  staleBranch,
}) => {
  const {
    config: { branching },
  } = useConfig()

  const { setPreference } = usePreferences()
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()

  const isEnabled = Boolean(branching?.enabled)

  // Tracked optimistically so the trigger label updates before the server
  // components finish re-rendering.
  const [activeBranch, setActiveBranchState] = useState(activeBranchFromServer)

  useEffect(() => {
    setActiveBranchState(activeBranchFromServer)
  }, [activeBranchFromServer])

  const setBranch = useCallback(
    (slug: string, { refresh = true }: { refresh?: boolean } = {}) => {
      if (slug === activeBranch) {
        return
      }

      setActiveBranchState(slug)

      // Awaited before refreshing: the server re-reads the preference to
      // resolve the branch, so refreshing first would race the write and
      // re-render against the branch we just left.
      void (async () => {
        await setPreference(PREFERENCE_KEYS.BRANCH, slug)

        if (refresh) {
          startRouteTransition(() => {
            router.refresh()
          })
        }
      })()
    },
    [activeBranch, router, setPreference, startRouteTransition],
  )

  // Creating a branch is a declaration of intent to work on it, so the switch
  // follows the save. Listening for the document event rather than wiring up
  // the create view means this covers every route a branch can be created
  // from — the full create page, and any drawer that ever opens onto it.
  const { mostRecentUpdate } = useDocumentEvents()

  useEffect(() => {
    if (
      mostRecentUpdate?.entitySlug !== branchesCollectionSlug ||
      mostRecentUpdate.operation !== 'create'
    ) {
      return
    }

    const createdSlug = (mostRecentUpdate.doc as { slug?: string } | undefined)?.slug

    if (createdSlug) {
      // No refresh: the create view redirects to the new document immediately
      // after this fires, and that navigation re-resolves the branch.
      setBranch(createdSlug, { refresh: false })
    }
  }, [mostRecentUpdate, setBranch])

  // Drops a stored selection pointing at a branch that no longer resolves, so
  // the next request starts clean on main instead of resurrecting it.
  useEffect(() => {
    if (staleBranch) {
      void setPreference(PREFERENCE_KEYS.BRANCH, MAIN_BRANCH)
    }
  }, [setPreference, staleBranch])

  return (
    <Context
      value={{
        activeBranch,
        branches,
        isEnabled,
        setBranch,
      }}
    >
      {children}
    </Context>
  )
}

export const useBranch = (): BranchContext => use(Context)

/**
 * The value to pass as the `branch` argument on an API call, or `undefined`
 * when the call should run against production.
 *
 * `main` is returned as `undefined` on purpose: passing no branch already means
 * `main` everywhere in Payload, so omitting it keeps ordinary requests free of
 * a parameter that changes nothing.
 */
export const useBranchParam = (): string | undefined => {
  const { activeBranch, isEnabled } = useBranch()

  return isEnabled && activeBranch !== MAIN_BRANCH ? activeBranch : undefined
}

/**
 * Whether to render the branch switcher at all.
 *
 * Shown whenever branching is enabled, even with no branches yet: the switcher
 * hosts the "new branch" action, so hiding it until a branch exists would leave
 * a project with no way to create its first one.
 *
 * Shared with the breadcrumb trail, which needs to know whether to draw the
 * separator that precedes the switcher.
 */
export const useShowBranchSelector = (): boolean => {
  const { isEnabled } = useBranch()

  return isEnabled
}
