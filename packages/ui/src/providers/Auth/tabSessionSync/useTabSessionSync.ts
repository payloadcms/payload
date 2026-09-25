'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  TabSessionEvent,
  TabSessionLogoutPublication,
  TabSessionPublication,
} from './index.js'

import { createTabSessionSync } from './index.js'

export type TabSessionSync = {
  /** Broadcasts a session lifecycle event to the other browser tabs. */
  broadcast: (event: TabSessionEvent) => TabSessionPublication | undefined
  /** Notifies storage-fallback tabs after the server-side logout request settles. */
  broadcastLogoutSettlement: (publication: TabSessionLogoutPublication) => void
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

  const broadcast = useCallback(
    (event: TabSessionEvent) => tabSessionSyncRef.current?.broadcast(event),
    [],
  )
  const broadcastLogoutSettlement = useCallback((publication: TabSessionLogoutPublication) => {
    tabSessionSyncRef.current?.broadcastLogoutSettlement(publication)
  }, [])

  return useMemo(
    () => ({ broadcast, broadcastLogoutSettlement }),
    [broadcast, broadcastLogoutSettlement],
  )
}

function createTabID(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}
