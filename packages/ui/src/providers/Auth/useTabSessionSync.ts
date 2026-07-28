'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  TabSessionEvent,
  TabSessionLogoutPublication,
  TabSessionPublication,
} from './tabSessionSync/index.js'

import { createTabSessionSync } from './tabSessionSync/index.js'

export type TabSessionSync = {
  /** Publishes a session lifecycle event to the other browser tabs. */
  publish: (event: TabSessionEvent) => TabSessionPublication | undefined
  /** Notifies storage-fallback tabs after the server-side logout request settles. */
  publishLogoutSettlement: (publication: TabSessionLogoutPublication) => void
}

/** Connects the Auth provider to one cross-tab session coordinator for the current browser tab. */
export function useTabSessionSync(
  options: Omit<Parameters<typeof createTabSessionSync>[0], 'sourceTabID'>,
): TabSessionSync {
  const [sourceTabID] = useState(createTabID)
  const optionsRef = useRef(options)
  const tabSessionSyncRef = useRef<ReturnType<typeof createTabSessionSync>>(undefined)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  useEffect(() => {
    const tabSessionSync = createTabSessionSync({
      getTokenExpirationMs: () => optionsRef.current.getTokenExpirationMs(),
      onSessionExpired: (expiredTokenAt) => optionsRef.current.onSessionExpired(expiredTokenAt),
      onSessionLoggedOut: () => optionsRef.current.onSessionLoggedOut(),
      onSessionRefreshed: (session) => optionsRef.current.onSessionRefreshed(session),
      onTabSessionUnauthenticated: () => optionsRef.current.onTabSessionUnauthenticated(),
      reconcileSession: (reconciliationOptions) =>
        optionsRef.current.reconcileSession(reconciliationOptions),
      sourceTabID,
    })

    tabSessionSyncRef.current = tabSessionSync

    return () => {
      if (tabSessionSyncRef.current === tabSessionSync) {
        tabSessionSyncRef.current = undefined
      }

      tabSessionSync.cleanup()
    }
  }, [sourceTabID])

  const publish = useCallback(
    (event: TabSessionEvent) => tabSessionSyncRef.current?.publish(event),
    [],
  )
  const publishLogoutSettlement = useCallback((publication: TabSessionLogoutPublication) => {
    tabSessionSyncRef.current?.publishLogoutSettlement(publication)
  }, [])

  return useMemo(() => ({ publish, publishLogoutSettlement }), [publish, publishLogoutSettlement])
}

function createTabID(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}
