'use client'
import { dequal } from 'dequal/lite' // lite: no need for Map and Set support
import { formatAdminURL } from 'payload/shared'
import React, { createContext, use, useCallback, useEffect, useRef } from 'react'

import type { Preferences } from '../../forms/Form/types.js'

import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { deepMergeSimple } from '../../utilities/deepMerge.js'
import { useAuth } from '../Auth/index.js'
import { useConfig } from '../Config/index.js'

type PreferenceUpdater<T> = (current: null | T) => T

type SetPreference = {
  <T = Preferences>(key: string, updater: PreferenceUpdater<T>): Promise<void>
  <T = Preferences>(key: string, value: T, merge?: boolean): Promise<void>
}

type PreferencesContext = {
  getPreference: <T = Preferences>(key: string) => Promise<T>
  /**
   * @param key - a string identifier for the property being set
   * @param value - preference data to store
   * @param merge - when true, combines the value with the existing preference stored under the key
   * and batches concurrent changes to that key into one request, default = false. Awaiting the
   * returned promise waits for the write to land either way.
   */
  setPreference: SetPreference
  syncPreference: <T = Preferences>(key: string, value: T) => void
}

const Context = createContext({} as PreferencesContext)

const requestOptions = (value, language) => ({
  body: JSON.stringify({ value }),
  headers: {
    'Accept-Language': language,
    'Content-Type': 'application/json',
  },
})

export const PreferencesProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const contextRef = useRef({} as PreferencesContext)
  const preferencesRef = useRef({})
  const pendingUpdate = useRef({})
  const scheduledMergedUpdates = useRef<Record<string, Promise<void>>>({})
  const pendingWrites = useRef<Record<string, number>>({})
  const updateQueues = useRef<Record<string, Promise<void>>>({})
  const latestWrites = useRef<Record<string, Promise<void>>>({})
  const { config } = useConfig()
  const { user } = useAuth()
  const { i18n } = useTranslation()

  const {
    routes: { api },
  } = config

  useEffect(() => {
    if (!user) {
      // clear preferences between users
      preferencesRef.current = {}
      pendingUpdate.current = {}
      pendingWrites.current = {}
      updateQueues.current = {}
      latestWrites.current = {}
    }
  }, [user])

  const getPreference = useCallback(
    async <T = unknown,>(key: string): Promise<T> => {
      const prefs = preferencesRef.current

      if (typeof prefs[key] !== 'undefined') {
        return prefs[key]
      }

      const promise = new Promise((resolve: (value: T) => void) => {
        void (async () => {
          const request = await requests.get(
            formatAdminURL({
              apiRoute: api,
              path: `/payload-preferences/${key}`,
            }),
            {
              credentials: 'include',
              headers: {
                'Accept-Language': i18n.language,
              },
            },
          )

          let value = null

          if (request.status === 200) {
            const preference = await request.json()
            value = preference.value
          }

          if (prefs[key] === promise) {
            prefs[key] = value
            resolve(value)
          } else {
            resolve(await prefs[key])
          }
        })()
      })

      prefs[key] = promise

      return promise
    },
    [i18n.language, api, preferencesRef],
  )

  const syncPreference = useCallback(<T = Preferences,>(key: string, value: T): void => {
    if (pendingWrites.current[key] || typeof pendingUpdate.current[key] !== 'undefined') {
      return
    }

    preferencesRef.current[key] = value
  }, [])

  const persistPreference = useCallback(
    async ({ key, value }: { key: string; value: unknown }): Promise<void> => {
      try {
        const response = await requests.post(
          formatAdminURL({ apiRoute: api, path: `/payload-preferences/${key}` }),
          requestOptions(value, i18n.language),
        )

        if (!response.ok) {
          throw new Error(`Preference write failed: ${response.status}`)
        }
      } catch (error) {
        if (preferencesRef.current[key] === value) {
          delete preferencesRef.current[key]
        }
        throw error
      }
    },
    [api, i18n.language],
  )

  const setPreference = useCallback(
    async <T = Preferences,>(
      key: string,
      value: PreferenceUpdater<T> | T,
      merge = false,
    ): Promise<void> => {
      if (typeof value === 'function') {
        const updater = value as PreferenceUpdater<T>
        const previousUpdate = updateQueues.current[key] ?? Promise.resolve()
        pendingWrites.current[key] = (pendingWrites.current[key] ?? 0) + 1
        const update = previousUpdate.then(async () => {
          const current = await getPreference<T>(key)
          const nextValue = updater(current ?? null)

          preferencesRef.current[key] = nextValue

          await persistPreference({ key, value: nextValue })
        })

        latestWrites.current[key] = update
        updateQueues.current[key] = update.catch(() => undefined)
        try {
          await update
        } finally {
          pendingWrites.current[key] -= 1
        }
        return
      }

      if (merge === false) {
        preferencesRef.current[key] = value
        pendingWrites.current[key] = (pendingWrites.current[key] ?? 0) + 1

        try {
          const update = persistPreference({ key, value })

          latestWrites.current[key] = update
          await update
        } finally {
          pendingWrites.current[key] -= 1
        }

        return
      }

      let newValue = value
      const currentPreference = await getPreference(key)

      // handle value objects where multiple values can be set under one key
      if (
        typeof value === 'object' &&
        typeof currentPreference === 'object' &&
        typeof newValue === 'object'
      ) {
        // merge the value with any existing preference for the key
        if (currentPreference) {
          newValue = deepMergeSimple(currentPreference, newValue)
        }

        if (dequal(newValue, currentPreference)) {
          await latestWrites.current[key]
          return
        }

        // add the requested changes to a pendingUpdate batch for the key
        pendingUpdate.current[key] = {
          ...pendingUpdate.current[key],
          ...(newValue as Record<string, unknown>),
        }
      } else {
        if (newValue === currentPreference) {
          await latestWrites.current[key]
          return
        }

        pendingUpdate.current[key] = newValue
      }

      const updatePreference = async () => {
        // compare the value stored in context before sending to eliminate duplicate requests
        if (dequal(pendingUpdate.current[key], preferencesRef.current[key])) {
          return
        }

        // Take this batch before awaiting persistence so later changes form a new batch.
        const nextValue = pendingUpdate.current[key]

        delete pendingUpdate.current[key]
        preferencesRef.current[key] = nextValue
        pendingWrites.current[key] = (pendingWrites.current[key] ?? 0) + 1

        const previousUpdate = updateQueues.current[key] ?? Promise.resolve()
        const update = previousUpdate.then(() => persistPreference({ key, value: nextValue }))

        const latestWrite = update.then(() => undefined)

        latestWrites.current[key] = latestWrite
        updateQueues.current[key] = latestWrite.catch(() => undefined)
        try {
          await update
        } finally {
          pendingWrites.current[key] -= 1
        }
      }

      // Callers coalesced into the same batch must all await its persisted write.
      if (typeof scheduledMergedUpdates.current[key] === 'undefined') {
        scheduledMergedUpdates.current[key] = new Promise<void>((resolve, reject) => {
          setTimeout(() => {
            delete scheduledMergedUpdates.current[key]
            updatePreference().then(resolve, reject)
          })
        })
      }

      await scheduledMergedUpdates.current[key]
    },
    [getPreference, persistPreference, pendingUpdate, updateQueues],
  )

  contextRef.current.getPreference = getPreference
  contextRef.current.setPreference = setPreference
  contextRef.current.syncPreference = syncPreference
  return <Context value={contextRef.current}>{children}</Context>
}

export const usePreferences = (): PreferencesContext => use(Context)
