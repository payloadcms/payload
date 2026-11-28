'use client'

import { formatAdminURL } from 'payload/shared'
import React, { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { requests } from '../../utilities/api.js'
import { useAuth } from '../Auth/index.js'
import { useConfig } from '../Config/index.js'

type AccessibilityContext = {
  flushHelpTooltips: () => Promise<void>
  isLoading: boolean
  isSaving: boolean
  resetHelpTooltips: () => void
  setShouldShowHelpTooltips: (args: { shouldShow: boolean }) => Promise<void>
  shouldShowHelpTooltips: boolean
}

type HelpPreference = { showHelpTooltips: boolean }

const Context = createContext<AccessibilityContext>({
  flushHelpTooltips: () => Promise.resolve(),
  isLoading: false,
  isSaving: false,
  resetHelpTooltips: () => undefined,
  setShouldShowHelpTooltips: () => Promise.resolve(),
  shouldShowHelpTooltips: true,
})

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const { config } = useConfig()
  const userKey = user ? `${user.collection}:${user.id}` : undefined
  const preferenceURL = formatAdminURL({
    apiRoute: config.routes.api,
    path: '/payload-preferences/showHelpTooltips',
  })
  const [preference, setPreferenceState] = useState({
    isLoading: Boolean(userKey),
    isSaving: false,
    shouldShowHelpTooltips: true,
    userKey,
  })
  const requestController = useRef<AbortController | null>(null)
  const pendingSave = useRef<null | Promise<void>>(null)
  const activeUserKey = useRef(userKey)

  activeUserKey.current = userKey
  const isCurrentUser = preference.userKey === userKey
  const isLoading = Boolean(userKey) && (!isCurrentUser || preference.isLoading)
  const isSaving = isCurrentUser && preference.isSaving
  const shouldShowHelpTooltips = isCurrentUser ? preference.shouldShowHelpTooltips : true

  useEffect(() => {
    const controller = new AbortController()

    requestController.current = controller
    setPreferenceState({
      isLoading: Boolean(userKey),
      isSaving: false,
      shouldShowHelpTooltips: true,
      userKey,
    })
    if (userKey) {
      void requests
        .get(preferenceURL, { signal: controller.signal })
        .then(async (response) => {
          if (response.ok) {
            const { value } = (await response.json()) as { value: HelpPreference | null }

            if (!controller.signal.aborted) {
              setPreferenceState((current) => ({
                ...current,
                shouldShowHelpTooltips: value?.showHelpTooltips !== false,
              }))
            }
          }
        })
        .catch(() => {
          // Keep the default when loading fails; the user can retry by changing the setting.
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setPreferenceState((current) => ({ ...current, isLoading: false }))
          }
        })
    }

    return () => requestController.current?.abort()
  }, [preferenceURL, userKey])

  const setShouldShowHelpTooltips = useCallback(
    async ({ shouldShow }: { shouldShow: boolean }) => {
      const controller = requestController.current

      if (
        !userKey ||
        activeUserKey.current !== userKey ||
        isLoading ||
        pendingSave.current !== null ||
        !controller ||
        controller.signal.aborted
      ) {
        return
      }
      setPreferenceState((current) => ({ ...current, isSaving: true }))
      const save = requests
        .post(preferenceURL, {
          body: JSON.stringify({
            value: { showHelpTooltips: shouldShow } satisfies HelpPreference,
          }),
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        })
        .then((response) => {
          if (controller.signal.aborted) {
            return
          }
          if (!response.ok) {
            throw new Error('Unable to save help tooltip preference')
          }
          setPreferenceState((current) => ({ ...current, shouldShowHelpTooltips: shouldShow }))
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            throw error
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setPreferenceState((current) => ({ ...current, isSaving: false }))
          }
          if (pendingSave.current === save) {
            pendingSave.current = null
          }
        })

      pendingSave.current = save
      await save
    },
    [isLoading, preferenceURL, userKey],
  )

  const flushHelpTooltips = useCallback(
    () => pendingSave.current?.catch(() => undefined) ?? Promise.resolve(),
    [],
  )
  const resetHelpTooltips = useCallback(() => {
    if (activeUserKey.current !== userKey) {
      return
    }
    requestController.current?.abort()
    requestController.current = new AbortController()
    setPreferenceState({ isLoading: false, isSaving: false, shouldShowHelpTooltips: true, userKey })
  }, [userKey])

  const value = useMemo(
    () => ({
      flushHelpTooltips,
      isLoading,
      isSaving,
      resetHelpTooltips,
      setShouldShowHelpTooltips,
      shouldShowHelpTooltips,
    }),
    [
      flushHelpTooltips,
      isLoading,
      isSaving,
      resetHelpTooltips,
      setShouldShowHelpTooltips,
      shouldShowHelpTooltips,
    ],
  )

  return <Context value={value}>{children}</Context>
}

export const useAccessibility = (): AccessibilityContext => use(Context)
