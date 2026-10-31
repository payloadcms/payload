'use client'

import { branchesCollectionSlug, MAIN_BRANCH, PREFERENCE_KEYS } from 'payload/shared'
import React, { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { confirmNavigation } from '../../elements/LeaveWithoutSaving/confirmNavigation.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { getBranchURL } from '../../utilities/getBranchURL.js'
import { useConfig } from '../Config/index.js'
import { useDocumentEvents } from '../DocumentEvents/index.js'
import { usePreferences } from '../Preferences/index.js'
import { RouterAdapterContext, useRouter } from '../RouterAdapter/index.js'
import { useRouteTransition } from '../RouteTransition/index.js'
import { useTranslation } from '../Translation/index.js'

export type BranchOption = {
  /** Absent for `main`, which is a sentinel rather than a document. */
  id?: number | string
  /**
   * Merged with nothing pending since — still a usable workspace, but worth
   * distinguishing from a branch with work on it.
   */
  isMerged?: boolean
  /** A merge is queued for this branch — worth knowing before switching onto it. */
  isScheduled?: boolean
  name: string
  slug: string
}

export type BranchContext = {
  /** Selected branch, including the optimistic switcher label during navigation. */
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

const RequestBranchContext = createContext<string>(MAIN_BRANCH)

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
  /** Request origin, including when no serverURL is configured. */
  origin?: string
  /**
   * Set when the request resolved to a branch the user can no longer see, so
   * the stored preference pointing at it can be cleared.
   */
  staleBranch?: null | string
}

/** Holds the request branch and preserves it in admin links and navigation. */
export const BranchProvider: React.FC<BranchProviderProps> = ({
  activeBranch: activeBranchFromServer,
  branches,
  children,
  origin,
  staleBranch,
}) => {
  const {
    config: {
      branching,
      routes: { admin: adminRoute },
      serverURL,
    },
  } = useConfig()

  const { setPreference } = usePreferences()
  const { t } = useTranslation()
  const selectionGeneration = useRef(0)
  const router = useRouter()
  const routerContext = use(RouterAdapterContext)
  const { startRouteTransition } = useRouteTransition()

  const isEnabled = Boolean(branching?.enabled)

  // Tracked optimistically so the trigger label updates before the server
  // components finish re-rendering.
  const [activeBranch, setActiveBranchState] = useState(activeBranchFromServer)

  const [previousServerBranch, setPreviousServerBranch] = useState(activeBranchFromServer)

  if (previousServerBranch !== activeBranchFromServer) {
    setPreviousServerBranch(activeBranchFromServer)
    setActiveBranchState(activeBranchFromServer)
  }

  const navigateToBranch = useCallback(
    ({ branch, shouldReplace = false }: { branch: string; shouldReplace?: boolean }) =>
      startRouteTransition(() => {
        const url = new URL(window.location.href)

        if (branch === MAIN_BRANCH) {
          url.searchParams.delete('branch')
        } else {
          url.searchParams.set('branch', branch)
        }

        const href = `${url.pathname}${url.search}${url.hash}`

        return shouldReplace
          ? router.replace(href, { scroll: false })
          : router.push(href, { scroll: false })
      }),
    [router, startRouteTransition],
  )

  const setBranch = useCallback(
    (slug: string, { refresh = true }: { refresh?: boolean } = {}) => {
      if (slug === activeBranch) {
        return
      }

      confirmNavigation({
        navigate: () => {
          const generation = ++selectionGeneration.current

          setActiveBranchState(slug)

          // Merge the selection without replacing other navigation preferences.
          void (async () => {
            try {
              await setPreference(PREFERENCE_KEYS.NAV, { branch: slug }, true)

              if (generation !== selectionGeneration.current) {
                return
              }

              if (refresh) {
                await navigateToBranch({ branch: slug })
              }
            } catch (_error) {
              if (generation === selectionGeneration.current) {
                setActiveBranchState(activeBranchFromServer)
                toast.error(t('error:unspecific'))
              }
            }
          })()
        },
      })
    },
    [activeBranch, activeBranchFromServer, navigateToBranch, setPreference, t],
  )

  // Creating a branch is a declaration of intent to work on it, so the switch
  // follows the save. Listening for the document event rather than wiring up
  // the create view means this covers every route a branch can be created
  // from — the full create page, and any drawer that ever opens onto it.
  const { mostRecentUpdate } = useDocumentEvents()

  const createdSlug =
    mostRecentUpdate?.entitySlug === branchesCollectionSlug &&
    mostRecentUpdate.operation === 'create'
      ? (mostRecentUpdate.doc as { slug?: string } | undefined)?.slug
      : undefined
  const [previousUpdate, setPreviousUpdate] = useState(mostRecentUpdate)

  if (previousUpdate !== mostRecentUpdate) {
    setPreviousUpdate(mostRecentUpdate)
    if (createdSlug) {
      setActiveBranchState(createdSlug)
    }
  }

  const handleCreatedPreferenceError = useEffectEvent(() => {
    setActiveBranchState(activeBranchFromServer)
    toast.error(t('error:unspecific'))
  })

  const navigateToCreatedBranch = useEffectEvent(({ branch }: { branch: string }) => {
    if (new URL(window.location.href).searchParams.get('branch') !== branch) {
      return navigateToBranch({ branch, shouldReplace: true })
    }
  })

  useEffect(() => {
    if (createdSlug) {
      // The full create view already redirects with the new branch. Drawers
      // need to update the current URL as well, without adding a history entry.
      void setPreference(PREFERENCE_KEYS.NAV, { branch: createdSlug }, true)
        .then(() => navigateToCreatedBranch({ branch: createdSlug }))
        .catch(() => {
          handleCreatedPreferenceError()
        })
    }
  }, [createdSlug, setPreference])

  // Drops a stored selection pointing at a branch that no longer resolves, so
  // the next request starts clean on main instead of resurrecting it.
  useEffect(() => {
    if (staleBranch) {
      void setPreference(PREFERENCE_KEYS.NAV, { branch: MAIN_BRANCH }, true).catch(() => {
        toast.error(t('error:unspecific'))
      })
    }
  }, [setPreference, staleBranch, t])

  const navigationContext = useMemo(() => {
    if (!routerContext || !isEnabled) {
      return routerContext
    }

    return {
      ...routerContext,
      resolveHref: (href: string) =>
        getBranchURL({
          adminRoute,
          branch: activeBranchFromServer,
          currentURL: new URL(
            `${routerContext.pathname}?${routerContext.searchParams.toString()}`,
            origin || serverURL || 'http://payload.local',
          ).href,
          href,
        }),
    }
  }, [activeBranchFromServer, adminRoute, isEnabled, origin, routerContext, serverURL])

  return (
    <RouterAdapterContext value={navigationContext}>
      <RequestBranchContext value={activeBranchFromServer}>
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
      </RequestBranchContext>
    </RouterAdapterContext>
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
  const { isEnabled } = useBranch()
  const requestBranch = use(RequestBranchContext)

  // Actions must use the branch that produced the displayed data until the new
  // server render arrives, even while the selector shows an optimistic choice.
  return isEnabled && requestBranch !== MAIN_BRANCH ? requestBranch : undefined
}

/**
 * Whether to render the branch switcher at all.
 *
 * Shown whenever branching is enabled, even with no branches yet: the switcher
 * hosts the "new branch" action, so hiding it until a branch exists would leave
 * a project with no way to create its first one.
 */
export const useShowBranchSelector = (): boolean => {
  const { isEnabled } = useBranch()

  return isEnabled
}
