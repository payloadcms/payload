import querystring from 'qs'
import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import type { TypeWithID } from '../../../../../../collections/config/types'

import useDebounce from '../../../../../hooks/useDebounce'
import { useConfig } from '../../../../utilities/Config'
import { useLocale } from '../../../../utilities/Locale'
import { reducer } from './reducer'

// documents are first set to null when requested
// set to false when no doc is returned
// or set to the document returned
export type Documents = {
  [slug: string]: {
    [id: number | string]: TypeWithID | false | null
  }
}

type ListRelationshipContext = {
  documents: Documents
  getRelationships: (
    docs: {
      relationTo: string
      value: number | string
    }[],
  ) => void
}

const Context = createContext({} as ListRelationshipContext)

export const RelationshipProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [documents, dispatchDocuments] = useReducer(reducer, {})
  const debouncedDocuments = useDebounce(documents, 100)
  const config = useConfig()
  const { i18n } = useTranslation()
  const { code: locale } = useLocale()
  const prevLocale = useRef(locale)

  const {
    routes: { api },
    serverURL,
  } = config

  const loadRelationshipDocs = useCallback(
    async (reloadAll = false) => {
      Object.entries(debouncedDocuments).forEach(async ([slug, docs]) => {
        const idsToLoad: (number | string)[] = []

        Object.entries(docs).forEach(([id, value]) => {
          if (value === null || reloadAll) {
            idsToLoad.push(id)
          }
        })

        if (idsToLoad.length > 0) {
          const url = `${serverURL}${api}/${slug}`
          const params = {
            depth: 0,
            limit: 250,
            locale,
            'where[id][in]': idsToLoad,
          }

          const query = querystring.stringify(params, { addQueryPrefix: true })
          const result = await fetch(`${url}${query}`, {
            credentials: 'include',
            headers: {
              'Accept-Language': i18n.language,
            },
          })

          if (result.ok) {
            const json = await result.json()
            if (json.docs) {
              dispatchDocuments({
                docs: json.docs,
                idsToLoad,
                relationTo: slug,
                type: 'ADD_LOADED',
              })
            }
          } else {
            dispatchDocuments({ docs: [], idsToLoad, relationTo: slug, type: 'ADD_LOADED' })
          }
        }
      })
    },
    [debouncedDocuments, serverURL, api, i18n, locale],
  )

  useEffect(() => {
    loadRelationshipDocs(locale && prevLocale.current !== locale)
    prevLocale.current = locale
  }, [locale, loadRelationshipDocs])

  const getRelationships = useCallback(
    async (relationships: { relationTo: string; value: number | string }[]) => {
      dispatchDocuments({ docs: relationships, type: 'REQUEST' })
    },
    [],
  )

  return <Context.Provider value={{ documents, getRelationships }}>{children}</Context.Provider>
}

export const useListRelationships = (): ListRelationshipContext => useContext(Context)
