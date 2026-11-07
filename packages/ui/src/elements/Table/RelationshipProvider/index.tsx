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

// a request for some of a collection's documents: `skipped` once a later change has left out its pending IDs,
// `isRetry` when it starts while its collection is retrying (see `retrying`), so that it is not retried in turn
type Batch = { isRetry: boolean; skipped: boolean }

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
  const inFlightIDs = useRef<Record<string, Map<string, Batch>>>({})
  // collections whose batch threw after a change left out its IDs, and that requested them again (below): until one of
  // their batches completes, their batches are not retried
  const retrying = useRef(new Set<string>())

  const loadRelationshipDocs = useCallback(
    (reloadAll = false) => {
      Object.entries(debouncedDocuments).forEach(async ([slug, docs]) => {
        const idsToLoad: (number | string)[] = []
        const inFlight = inFlightIDs.current[slug] ?? new Map<string, Batch>()
        inFlightIDs.current[slug] = inFlight

        Object.entries(docs).forEach(([id, value]) => {
          const pending = inFlight.get(id)

          if ((value === null && !pending) || reloadAll) {
            idsToLoad.push(id)
          } else if (value === null && pending) {
            // left to its batch: if that batch throws, the ID is requested once more (below)
            pending.skipped = true
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

          const batch: Batch = { isRetry: retrying.current.has(slug), skipped: false }
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

            retrying.current.delete(slug)
          } catch (error) {
            // the IDs stay `null`: released below, they are requested again on the next change
            console.error('Error loading relationship documents', error) // eslint-disable-line no-console

            // a change left them to this batch while it was pending: request them once more in its place (a retry
            // that throws as well is not retried)
            if (batch.skipped && !batch.isRetry) {
              retrying.current.add(slug)
              dispatchDocuments({
                type: 'REQUEST',
                docs: idsToString
                  .filter((id) => inFlight.get(id) === batch)
                  .map((value) => ({ relationTo: slug, value })),
              })
            }
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
