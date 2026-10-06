'use client'
import { dequal } from 'dequal/lite' // lite: no need for Map and Set support
import { formatAdminURL } from 'payload/shared'
import React, { createContext, use, useCallback, useEffect, useRef } from 'react'

import type { Preferences } from '../../forms/Form/types.js'

import { requests } from '../../../shared/utilities/api.js'
import { deepMergeSimple } from '../../utilities/deepMerge.js'
import { useAuth } from '../Auth/index.js'
import { useConfig } from '../Config/index.js'
import { useTranslation } from '../Translation/index.js'

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
   * @param merge - when true will combine the existing preference object batch the change into one request for objects, default = false
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
  const pendingWrites = useRef<Record<string, number>>({})
  const updateQueues = useRef<Record<string, Promise<void>>>({})
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

          await requests.post(
            formatAdminURL({
              apiRoute: api,
              path: `/payload-preferences/${key}`,
            }),
            requestOptions(nextValue, i18n.language),
          )
        })

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
          await requests.post(
            formatAdminURL({
              apiRoute: api,
              path: `/payload-preferences/${key}`,
            }),
            requestOptions(value, i18n.language),
          )
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
          return
        }

        // add the requested changes to a pendingUpdate batch for the key
        pendingUpdate.current[key] = {
          ...pendingUpdate.current[key],
          ...(newValue as Record<string, unknown>),
        }
      } else {
        if (newValue === currentPreference) {
          return
        }

        pendingUpdate.current[key] = newValue
      }

      const updatePreference = async () => {
        // compare the value stored in context before sending to eliminate duplicate requests
        if (dequal(pendingUpdate.current[key], preferencesRef.current[key])) {
          return
        }

        // preference set in context here to prevent other updatePreference at the same time
        preferencesRef.current[key] = pendingUpdate.current[key]

        await requests.post(
          formatAdminURL({
            apiRoute: api,
            path: `/payload-preferences/${key}`,
          }),
          requestOptions(preferencesRef.current[key], i18n.language),
        )

        // reset any changes for this key after sending the request
        delete pendingUpdate.current[key]
      }

      // use timeout to allow multiple changes of different values using the same key in one request
      setTimeout(() => {
        void updatePreference()
      })
    },
    [api, getPreference, i18n.language, pendingUpdate, updateQueues],
  )

  contextRef.current.getPreference = getPreference
  contextRef.current.setPreference = setPreference
  contextRef.current.syncPreference = syncPreference
  return <Context value={contextRef.current}>{children}</Context>
}

export const usePreferences = (): PreferencesContext => use(Context)
