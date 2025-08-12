'use client'
import type { TypeWithID } from 'payload'

import React, { createContext, use, useCallback, useEffect, useReducer, useRef } from 'react'

import { useDebounce } from '../../../hooks/useDebounce.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useLocale } from '../../../providers/Locale/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { reducer } from './reducer.js'

// documents are first set to null when requested
// set to false when no doc is returned
// or set to the document returned
export type Documents = {
  [slug: string]: {
    [id: number | string]: false | null | TypeWithID
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

export const RelationshipProvider: React.FC<{ readonly children?: React.ReactNode }> = ({
  children,
}) => {
  const [documents, dispatchDocuments] = useReducer(reducer, {})
  const debouncedDocuments = useDebounce(documents, 100)

  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const { i18n } = useTranslation()
  const { code: locale } = useLocale()
  const prevLocale = useRef(locale)

  const loadRelationshipDocs = useCallback(
    (reloadAll = false) => {
      Object.entries(debouncedDocuments).forEach(async ([slug, docs]) => {
        const idsToLoad: (number | string)[] = []

        Object.entries(docs).forEach(([id, value]) => {
          if (value === null || reloadAll) {
            idsToLoad.push(id)
          }
        })

        if (idsToLoad.length > 0) {
          const url = `${serverURL}${api}/${slug}`

          const params = new URLSearchParams()

          params.append('depth', '0')
          params.append('limit', '250')

          if (locale) {
            params.append('locale', locale)
          }

          if (idsToLoad && idsToLoad.length > 0) {
            const idsToString = idsToLoad.map((id) => String(id))
            params.append('where[id][in]', idsToString.join(','))
          }

          const query = `?${params.toString()}`

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
                type: 'ADD_LOADED',
                docs: json.docs,
                idsToLoad,
                relationTo: slug,
              })
            }
          } else {
            dispatchDocuments({ type: 'ADD_LOADED', docs: [], idsToLoad, relationTo: slug })
          }
        }
      })
    },
    [debouncedDocuments, serverURL, api, i18n, locale],
  )

  useEffect(() => {
    void loadRelationshipDocs(locale && prevLocale.current !== locale)
    prevLocale.current = locale
  }, [locale, loadRelationshipDocs])

  const getRelationships = useCallback(
    (relationships: { relationTo: string; value: number | string }[]) => {
      dispatchDocuments({ type: 'REQUEST', docs: relationships })
    },
    [],
  )

  return <Context value={{ documents, getRelationships }}>{children}</Context>
}

export const useListRelationships = (): ListRelationshipContext => use(Context)
