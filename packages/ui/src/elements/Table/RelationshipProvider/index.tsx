'use client'
import type { SelectType, TypeWithID } from 'payload'

import { appendUploadSelectFields, formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
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

// One request reads at most this many documents, so a longer list of ids goes
// in parts of this size.
const PAGE_SIZE = 250

export const RelationshipProvider: React.FC<{ readonly children?: React.ReactNode }> = ({
  children,
}) => {
  const [documents, dispatchDocuments] = useReducer(reducer, {})
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
          const url = formatAdminURL({ apiRoute: api, path: `/${slug}` })

          const collection = collections.find((c) => c.slug === slug)

          if (!collection) {
            return
          }

          const fieldToSelect = collection.admin.useAsTitle ?? 'id'
          const select: SelectType = { [fieldToSelect]: true }

          if (collection.upload) {
            appendUploadSelectFields({ collectionConfig: collection, select })
          }

          // A page of cells asks for its documents at once, so the list can run
          // past the page size the request reads. Send it in page-sized parts:
          // the ids a single request leaves out would be stored as missing and
          // stay shown as untitled until the page reloads.
          for (let start = 0; start < idsToLoad.length; start += PAGE_SIZE) {
            const batch = idsToLoad.slice(start, start + PAGE_SIZE)
            const params = new URLSearchParams()

            params.append('depth', '0')
            params.append('draft', 'true')
            params.append('limit', String(PAGE_SIZE))
            params.append('where[id][in]', batch.map((id) => String(id)).join(','))

            if (locale) {
              params.append('locale', locale)
            }

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
                  idsToLoad: batch,
                  relationTo: slug,
                })
              }
            } else {
              dispatchDocuments({
                type: 'ADD_LOADED',
                docs: [],
                idsToLoad: batch,
                relationTo: slug,
              })
            }
          }
        }
      })
    },
    [debouncedDocuments, api, i18n, locale, collections],
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
