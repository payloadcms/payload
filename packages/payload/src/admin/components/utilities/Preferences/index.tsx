import isDeepEqual from 'deep-equal'
import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { requests } from '../../../api'
import { useAuth } from '../Auth'
import { useConfig } from '../Config'

type PreferencesContext = {
  getPreference: <T = any>(key: string) => Promise<T> | T
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
  const config = useConfig()
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
      if (typeof prefs[key] !== 'undefined') return prefs[key]
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
      if (
        typeof value === 'object' &&
        typeof preferencesRef.current[key] === 'object' &&
        typeof newValue === 'object'
      ) {
        newValue = { ...(currentPreference || {}), ...value }
        if (isDeepEqual(newValue, currentPreference)) {
          return
        }
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
        if (isDeepEqual(pendingUpdate.current[key], preferencesRef.current[key])) {
          return
        }
        preferencesRef.current[key] = pendingUpdate.current[key]

        await requests.post(
          `${serverURL}${api}/payload-preferences/${key}`,
          requestOptions(preferencesRef.current[key], i18n.language),
        )
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

  return <Context.Provider value={contextRef.current}>{children}</Context.Provider>
}

export const usePreferences = (): PreferencesContext => useContext(Context)
