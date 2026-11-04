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

  // IDs whose request is still in flight, per collection, with the batch that requested them. A requested document
  // stays `null` until its response arrives, and `documents` changes while it is pending (more cells mount, another
  // collection's batch comes back), so without this the pending IDs would be requested again on every one of those
  // changes.
  const inFlightIDs = useRef<Record<string, Map<string, object>>>({})

  const loadRelationshipDocs = useCallback(
    (reloadAll = false) => {
      Object.entries(debouncedDocuments).forEach(async ([slug, docs]) => {
        const idsToLoad: (number | string)[] = []
        const inFlight = inFlightIDs.current[slug] ?? new Map<string, object>()
        inFlightIDs.current[slug] = inFlight

        Object.entries(docs).forEach(([id, value]) => {
          if ((value === null && !inFlight.has(id)) || reloadAll) {
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

          const batch = {}
          idsToString.forEach((id) => inFlight.set(id, batch))

          try {
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
          } catch (error) {
            // the IDs stay `null`: released below, they are requested again on the next change
            console.error('Error loading relationship documents', error) // eslint-disable-line no-console
          }

          // a later batch (a locale change) may have taken an ID over: release only this batch's own
          idsToString.forEach((id) => {
            if (inFlight.get(id) === batch) {
              inFlight.delete(id)
            }
          })
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
