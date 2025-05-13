'use client'
import { dequal } from 'dequal/lite' // lite: no need for Map and Set support
import React, { createContext, use, useCallback, useEffect, useRef } from 'react'

import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { deepMergeSimple } from '../../utilities/deepMerge.js'
import { useAuth } from '../Auth/index.js'
import { useConfig } from '../Config/index.js'

type PreferencesContext = {
  getPreference: <T = any>(key: string) => Promise<T>
  /**
   * @param key - a string identifier for the property being set
   * @param value - preference data to store
   * @param merge - when true will combine the existing preference object batch the change into one request for objects, default = false
   */
  setPreference: <T = any>(key: string, value: T, merge?: boolean) => Promise<void>
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
  const { config } = useConfig()
  const { user } = useAuth()
  const { i18n } = useTranslation()

  const {
    routes: { api },
    serverURL,
  } = config

  useEffect(() => {
    if (!user) {
      // clear preferences between users
      preferencesRef.current = {}
    }
  }, [user])

  const getPreference = useCallback(
    async <T = any,>(key: string): Promise<T> => {
      const prefs = preferencesRef.current

      if (typeof prefs[key] !== 'undefined') {
        return prefs[key]
      }

      const promise = new Promise((resolve: (value: T) => void) => {
        void (async () => {
          const request = await requests.get(`${serverURL}${api}/payload-preferences/${key}`, {
            headers: {
              'Accept-Language': i18n.language,
            },
          })

          let value = null

          if (request.status === 200) {
            const preference = await request.json()
            value = preference.value
          }

          preferencesRef.current[key] = value

          resolve(value)
        })()
      })

      prefs[key] = promise

      return promise
    },
    [i18n.language, api, preferencesRef, serverURL],
  )

  const setPreference = useCallback(
    async (key: string, value: unknown, merge = false): Promise<void> => {
      if (merge === false) {
        preferencesRef.current[key] = value

        await requests.post(
          `${serverURL}${api}/payload-preferences/${key}`,
          requestOptions(value, i18n.language),
        )

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
          `${serverURL}${api}/payload-preferences/${key}`,
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
    [api, getPreference, i18n.language, pendingUpdate, serverURL],
  )

  contextRef.current.getPreference = getPreference
  contextRef.current.setPreference = setPreference

  return <Context value={contextRef.current}>{children}</Context>
}

export const usePreferences = (): PreferencesContext => use(Context)
