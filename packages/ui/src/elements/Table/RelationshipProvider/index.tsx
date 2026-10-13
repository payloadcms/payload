'use client'
import type { ListViewClientProps, SelectType, TypeWithID } from 'payload'

import { appendUploadSelectFields, formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { createContext, use, useCallback, useEffect, useReducer, useState } from 'react'

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

const emptyDocuments: Documents = {}

type RelationshipProviderProps = {
  readonly children?: React.ReactNode
  prefetchedRelationships?: ListViewClientProps['prefetchedRelationships']
}

export const RelationshipProvider: React.FC<RelationshipProviderProps> = ({
  children,
  prefetchedRelationships,
}) => {
  const currentLocale = useLocale()
  const locale = currentLocale?.code
  const initialDocuments =
    prefetchedRelationships?.locale === locale
      ? (prefetchedRelationships?.documents ?? emptyDocuments)
      : emptyDocuments

  const [cache, setCache] = useState({ documents: initialDocuments, version: 0 })

  // Remount cells with new list data so unchanged relationship IDs request their data again.
  if (cache.documents !== initialDocuments) {
    setCache({ documents: initialDocuments, version: cache.version + 1 })
  }

  return (
    <RelationshipCache initialDocuments={initialDocuments} key={`${locale}:${cache.version}`}>
      {children}
    </RelationshipCache>
  )
}

const RelationshipCache: React.FC<{
  readonly children?: React.ReactNode
  initialDocuments: Documents
}> = ({ children, initialDocuments }) => {
  const [documents, dispatchDocuments] = useReducer(reducer, initialDocuments)
  const debouncedDocuments = useDebounce(documents, 100)

  const {
    config: {
      collections,
      routes: { api },
    },
  } = useConfig()

  const { i18n } = useTranslation()
  const currentLocale = useLocale()
  const locale = currentLocale?.code

  const loadRelationshipDocs = useCallback(() => {
    if (documents !== debouncedDocuments) {
      return
    }
    Object.entries(debouncedDocuments).forEach(async ([slug, docs]) => {
      const idsToLoad: (number | string)[] = []

      Object.entries(docs).forEach(([id, value]) => {
        if (value === null) {
          idsToLoad.push(id)
        }
      })

      if (idsToLoad.length > 0) {
        const url = formatAdminURL({ apiRoute: api, path: `/${slug}` })

        const params = new URLSearchParams()
        const select: SelectType = {}

        params.append('depth', '0')
        params.append('draft', 'true')
        params.append('limit', '250')

        const collection = collections.find((c) => c.slug === slug)

        if (!collection) {
          return
        }

        const fieldToSelect = collection.admin.useAsTitle ?? 'id'

        select[fieldToSelect] = true

        if (collection.upload) {
          appendUploadSelectFields({ collectionConfig: collection, select })
        }

        if (locale) {
          params.append('locale', locale)
        }

        const idsToString = idsToLoad.map((id) => String(id))
        params.append('where[id][in]', idsToString.join(','))

        const query = `?${params.toString()}&${qs.stringify({ select })}`

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
  }, [debouncedDocuments, documents, api, i18n, locale, collections])

  useEffect(() => {
    void loadRelationshipDocs()
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
