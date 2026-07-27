'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  AuthSessionLogoutPublication,
  AuthSessionSyncEvent,
  AuthSessionSyncPublication,
} from './sessionSync.js'

import { createAuthSessionSync } from './sessionSync.js'

export type AuthSessionSyncController = {
  publish: (event: AuthSessionSyncEvent) => AuthSessionSyncPublication | undefined
  publishStorageRefresh: (publication: AuthSessionLogoutPublication) => void
}

export function useSessionSync(
  options: Omit<Parameters<typeof createAuthSessionSync>[0], 'sourceID'>,
): AuthSessionSyncController {
  const [sourceID] = useState(createSessionSyncSourceID)
  const optionsRef = useRef(options)
  const sessionSyncRef = useRef<ReturnType<typeof createAuthSessionSync>>(undefined)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  useEffect(() => {
    const sessionSync = createAuthSessionSync({
      fetchFullUser: (resyncOptions) => optionsRef.current.fetchFullUser(resyncOptions),
      getTokenExpirationMs: () => optionsRef.current.getTokenExpirationMs(),
      onSessionExpired: (expiredTokenAt) => optionsRef.current.onSessionExpired(expiredTokenAt),
      onSessionLoggedOut: () => optionsRef.current.onSessionLoggedOut(),
      onSessionRefreshed: (session) => optionsRef.current.onSessionRefreshed(session),
      onSessionResyncUnauthenticated: () => optionsRef.current.onSessionResyncUnauthenticated(),
      sourceID,
    })

    sessionSyncRef.current = sessionSync

    return () => {
      if (sessionSyncRef.current === sessionSync) {
        sessionSyncRef.current = undefined
      }

      sessionSync.cleanup()
    }
  }, [sourceID])

  const publish = useCallback(
    (event: AuthSessionSyncEvent) => sessionSyncRef.current?.publish(event),
    [],
  )
  const publishStorageRefresh = useCallback((publication: AuthSessionLogoutPublication) => {
    sessionSyncRef.current?.publishStorageRefresh(publication)
  }, [])

  return useMemo(() => ({ publish, publishStorageRefresh }), [publish, publishStorageRefresh])
}

function createSessionSyncSourceID(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}
