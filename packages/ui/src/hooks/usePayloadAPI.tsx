'use client'
import queryString from 'qs'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../providers/Translation'

import { requests } from '../utilities/api'
import { useLocale } from '../providers/Locale'

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

const usePayloadAPI: UsePayloadAPI = (url, options = {}) => {
  const { initialData, initialParams = {} } = options

  const { i18n } = useTranslation()
  const [data, setData] = useState(initialData || {})
  const [params, setParams] = useState(initialParams)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const { code: locale } = useLocale()
  const hasInitialized = useRef(false)

  const search = queryString.stringify(
    {
      locale,
      ...(typeof params === 'object' ? params : {}),
    },
    {
      addQueryPrefix: true,
    },
  )

  useEffect(() => {
    if (initialData && !hasInitialized.current) {
      hasInitialized.current = true
      return
    }

    const abortController = new AbortController()

    const fetchData = async () => {
      setIsError(false)
      setIsLoading(true)
      console.log('url', `${url}${search}`)
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
      fetchData()
    } else {
      setIsError(false)
      setIsLoading(false)
    }

    return () => {
      abortController.abort()
    }
  }, [url, locale, search, i18n.language])

  return [{ data, isError, isLoading }, { setParams }]
}

export default usePayloadAPI
