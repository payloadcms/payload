import queryString from 'qs'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { requests } from '../api'
import { useLocale } from '../components/utilities/Locale'

type Result = [
  {
    data: any
    isError: boolean
    isLoading: boolean
  },
  {
    refetchData: (abortController?: AbortController) => Promise<void>
    setParams: React.Dispatch<unknown>
  },
]

type Options = {
  initialData?: any
  initialParams?: unknown
}

type UsePayloadAPI = (url: string, options?: Options) => Result

const usePayloadAPI: UsePayloadAPI = (url, options = {}) => {
  const { initialData = {}, initialParams = {} } = options

  const { i18n } = useTranslation()
  const [data, setData] = useState(initialData)
  const [params, setParams] = useState(initialParams)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const { code: locale } = useLocale()

  const search = queryString.stringify(
    {
      locale,
      ...(typeof params === 'object' ? params : {}),
    },
    {
      addQueryPrefix: true,
    },
  )

  const fetchData = useCallback(
    async (abortController?: AbortController) => {
      if (url) {
        setIsError(false)
        setIsLoading(true)
        try {
          const response = await requests.get(`${url}${search}`, {
            headers: {
              'Accept-Language': i18n.language,
            },
            signal: abortController ? abortController.signal : undefined,
          })

          if (response.status > 201) {
            setIsError(true)
          }

          const json = await response.json()
          setData(json)
          setIsLoading(false)
        } catch (error) {
          if (!abortController || !abortController.signal.aborted) {
            setIsError(true)
            setIsLoading(false)
          }
        }
      } else {
        setIsError(false)
        setIsLoading(false)
      }
    },
    [url, search, i18n.language],
  )

  useEffect(() => {
    const abortController = new AbortController()
    void fetchData(abortController)

    return () => {
      abortController.abort()
    }
  }, [url, search, fetchData])

  return [
    { data, isError, isLoading },
    { refetchData: fetchData, setParams },
  ]
}

export default usePayloadAPI
