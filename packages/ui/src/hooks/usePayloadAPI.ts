'use client'
import type React from 'react'

import * as qs from 'qs-esm'
import { useEffect, useRef, useState } from 'react'

import { useLocale } from '../providers/Locale/index.js'
import { useTranslation } from '../providers/Translation/index.js'
import { requests } from '../utilities/api.js'

type Result = [
  {
    data: any
    isError: boolean
    isLoading: boolean
  },
  {
    setParams: React.Dispatch<unknown>
  },
]

type Options = {
  initialData?: any
  initialParams?: unknown
}

type UsePayloadAPI = (url: string, options?: Options) => Result

export const usePayloadAPI: UsePayloadAPI = (url, options = {}) => {
  const { initialData, initialParams = {} } = options

  const { i18n } = useTranslation()
  const [data, setData] = useState(initialData || {})
  const [params, setParams] = useState(initialParams)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [isError, setIsError] = useState(false)
  const { code: locale } = useLocale()
  const hasInitialized = useRef(false)

  const search = qs.stringify(
    {
      locale,
      ...(typeof params === 'object' ? params : {}),
    },
    {
      addQueryPrefix: true,
    },
  )

  // If `initialData`, no need to make a request
  useEffect(() => {
    if (initialData && !hasInitialized.current) {
      hasInitialized.current = true
      return
    }

    const abortController = new AbortController()

    const fetchData = async () => {
      setIsError(false)
      setIsLoading(true)

      try {
        const response = await requests.get(`${url}${search}`, {
          headers: {
            'Accept-Language': i18n.language,
          },
          signal: abortController.signal,
        })

        if (response.status > 201) {
          setIsError(true)
        }

        const json = await response.json()

        setData(json)
        setIsLoading(false)
      } catch (error) {
        if (!abortController.signal.aborted) {
          setIsError(true)
          setIsLoading(false)
        }
      }
    }

    if (url) {
      void fetchData()
    } else {
      setIsError(false)
      setIsLoading(false)
    }

    return () => {
      try {
        abortController.abort()
      } catch (_err) {
        // swallow error
      }
    }
  }, [url, locale, search, i18n.language, initialData])

  // If `initialData` changes, reset the state
  useEffect(() => {
    if (initialData && hasInitialized.current) {
      setData(initialData)
    }
  }, [initialData])

  return [{ data, isError, isLoading }, { setParams }]
}
