'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  CrossTabSessionEvent,
  CrossTabSessionLogoutPublication,
  CrossTabSessionPublication,
} from './crossTabSessionSync.js'

import { createCrossTabSessionSync } from './crossTabSessionSync.js'

export type CrossTabSessionSync = {
  /** Publishes a session lifecycle event to the other browser tabs. */
  publish: (event: CrossTabSessionEvent) => CrossTabSessionPublication | undefined
  /** Notifies storage-fallback tabs after the server-side logout request settles. */
  publishLogoutSettlement: (publication: CrossTabSessionLogoutPublication) => void
}

/** Connects the Auth provider to one cross-tab session coordinator for the current browser tab. */
export function useCrossTabSessionSync(
  options: Omit<Parameters<typeof createCrossTabSessionSync>[0], 'sourceTabID'>,
): CrossTabSessionSync {
  const [sourceTabID] = useState(createTabID)
  const optionsRef = useRef(options)
  const crossTabSessionRef = useRef<ReturnType<typeof createCrossTabSessionSync>>(undefined)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  useEffect(() => {
    const crossTabSession = createCrossTabSessionSync({
      getTokenExpirationMs: () => optionsRef.current.getTokenExpirationMs(),
      onCrossTabSessionUnauthenticated: () => optionsRef.current.onCrossTabSessionUnauthenticated(),
      onSessionExpired: (expiredTokenAt) => optionsRef.current.onSessionExpired(expiredTokenAt),
      onSessionLoggedOut: () => optionsRef.current.onSessionLoggedOut(),
      onSessionRefreshed: (session) => optionsRef.current.onSessionRefreshed(session),
      reconcileSession: (reconciliationOptions) =>
        optionsRef.current.reconcileSession(reconciliationOptions),
      sourceTabID,
    })

    crossTabSessionRef.current = crossTabSession

    return () => {
      if (crossTabSessionRef.current === crossTabSession) {
        crossTabSessionRef.current = undefined
      }

      crossTabSession.cleanup()
    }
  }, [sourceTabID])

  const publish = useCallback(
    (event: CrossTabSessionEvent) => crossTabSessionRef.current?.publish(event),
    [],
  )
  const publishLogoutSettlement = useCallback((publication: CrossTabSessionLogoutPublication) => {
    crossTabSessionRef.current?.publishLogoutSettlement(publication)
  }, [])

  return useMemo(() => ({ publish, publishLogoutSettlement }), [publish, publishLogoutSettlement])
}

function createTabID(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}
