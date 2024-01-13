'use client'
import qs from 'qs'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import type { TypeWithTimestamps } from 'payload/types'
import type { PaginatedDocs, TypeWithVersion } from 'payload/database'
import type {
  TypeWithID,
  DocumentPreferences,
  Where,
  DocumentPermissions,
  DocumentInfoContext,
} from 'payload/types'
import type { Props } from './types'

import { useTranslation } from '../../providers/Translation'
import { useAuth } from '../Auth'
import { useConfig } from '../Config'
import { useLocale } from '../Locale'
import { usePreferences } from '../Preferences'
import { useParams } from 'next/navigation'

const Context = createContext({} as DocumentInfoContext)

export const useDocumentInfo = (): DocumentInfoContext => useContext(Context)

export const DocumentInfoProvider: React.FC<Props> = ({
  id: idFromProps,
  children,
  collectionSlug,
  globalSlug,
  idFromParams: getIDFromParams,
  versionsConfig,
}) => {
  const { id: idFromParams } = useParams()
  const id = idFromProps || (getIDFromParams ? (idFromParams as string) : null)

  const {
    routes: { api },
    serverURL,
  } = useConfig()
  const { getPreference, setPreference } = usePreferences()
  const { i18n } = useTranslation()
  const { permissions } = useAuth()
  const { code } = useLocale()
  const [publishedDoc, setPublishedDoc] = useState<TypeWithID & TypeWithTimestamps>(null)
  const [versions, setVersions] = useState<PaginatedDocs<TypeWithVersion<any>>>(null)
  const [unpublishedVersions, setUnpublishedVersions] =
    useState<PaginatedDocs<TypeWithVersion<any>>>(null)
  const [docPermissions, setDocPermissions] = useState<DocumentPermissions>(null)

  const baseURL = `${serverURL}${api}`
  let slug: string
  let pluralType: 'collections' | 'globals'
  let preferencesKey: string

  if (globalSlug) {
    slug = globalSlug
    pluralType = 'globals'
    preferencesKey = `global-${slug}`
  }

  if (collectionSlug) {
    slug = collectionSlug
    pluralType = 'collections'

    if (id) {
      preferencesKey = `collection-${slug}-${id}`
    }
  }

  const getVersions = useCallback(async () => {
    let versionFetchURL
    let publishedFetchURL
    let shouldFetchVersions = Boolean(versionsConfig)
    let unpublishedVersionJSON = null
    let versionJSON = null
    let shouldFetch = true

    const versionParams = {
      depth: 0,
      where: {
        and: [],
      },
    }

    const publishedVersionParams: { depth: number; locale: string; where: Where } = {
      depth: 0,
      locale: code || undefined,
      where: {
        and: [
          {
            or: [
              {
                _status: {
                  equals: 'published',
                },
              },
              {
                _status: {
                  exists: false,
                },
              },
            ],
          },
        ],
      },
    }

    if (globalSlug) {
      versionFetchURL = `${baseURL}/globals/${globalSlug}/versions`
      publishedFetchURL = `${baseURL}/globals/${globalSlug}?${qs.stringify(publishedVersionParams)}`
    }

    if (collectionSlug) {
      versionFetchURL = `${baseURL}/${collectionSlug}/versions`

      publishedVersionParams.where.and.push({
        id: {
          equals: id,
        },
      })

      publishedFetchURL = `${baseURL}/${collectionSlug}?${qs.stringify(publishedVersionParams)}`

      if (!id) {
        shouldFetch = false
      }

      versionParams.where.and.push({
        parent: {
          equals: id,
        },
      })
    }

    if (shouldFetch) {
      let publishedJSON

      if (versionsConfig?.drafts) {
        publishedJSON = await fetch(publishedFetchURL, {
          credentials: 'include',
          headers: {
            'Accept-Language': i18n.language,
          },
        }).then((res) => res.json())

        if (collectionSlug) {
          publishedJSON = publishedJSON?.docs?.[0]
        }
      }

      if (shouldFetchVersions) {
        versionJSON = await fetch(`${versionFetchURL}?${qs.stringify(versionParams)}`, {
          credentials: 'include',
          headers: {
            'Accept-Language': i18n.language,
          },
        }).then((res) => res.json())

        if (publishedJSON?.updatedAt) {
          const newerVersionParams = {
            ...versionParams,
            where: {
              ...versionParams.where,
              and: [
                ...versionParams.where.and,
                {
                  updatedAt: {
                    greater_than: publishedJSON?.updatedAt,
                  },
                },
              ],
            },
          }

          // Get any newer versions available
          const newerVersionRes = await fetch(
            `${versionFetchURL}?${qs.stringify(newerVersionParams)}`,
            {
              credentials: 'include',
              headers: {
                'Accept-Language': i18n.language,
              },
            },
          )

          if (newerVersionRes.status === 200) {
            unpublishedVersionJSON = await newerVersionRes.json()
          }
        }
      }

      setPublishedDoc(publishedJSON)
      setVersions(versionJSON)
      setUnpublishedVersions(unpublishedVersionJSON)
    }
  }, [i18n, globalSlug, collectionSlug, id, baseURL, code, versionsConfig])

  const getDocPermissions = React.useCallback(async () => {
    let docAccessURL: string
    const params = {
      locale: code || undefined,
    }
    if (pluralType === 'globals') {
      docAccessURL = `/globals/${slug}/access`
    } else if (pluralType === 'collections' && id) {
      docAccessURL = `/${slug}/access/${id}`
    }

    if (docAccessURL) {
      const res = await fetch(`${serverURL}${api}${docAccessURL}?${qs.stringify(params)}`, {
        credentials: 'include',
        headers: {
          'Accept-Language': i18n.language,
        },
      })
      const json = await res.json()
      setDocPermissions(json)
    } else {
      // fallback to permissions from the entity type
      // (i.e. create has no id)
      setDocPermissions(permissions?.[pluralType]?.[slug])
    }
  }, [serverURL, api, pluralType, slug, id, permissions, i18n.language, code])

  const getDocPreferences = useCallback(async () => {
    return getPreference<DocumentPreferences>(preferencesKey)
  }, [getPreference, preferencesKey])

  const setDocFieldPreferences = useCallback<DocumentInfoContext['setDocFieldPreferences']>(
    async (path, fieldPreferences) => {
      const allPreferences = await getDocPreferences()

      if (preferencesKey) {
        try {
          await setPreference(preferencesKey, {
            ...allPreferences,
            fields: {
              ...(allPreferences?.fields || {}),
              [path]: {
                ...allPreferences?.fields?.[path],
                ...fieldPreferences,
              },
            },
          })
        } catch (e) {
          console.error(e)
        }
      }
    },
    [setPreference, preferencesKey, getDocPreferences],
  )

  useEffect(() => {
    getVersions()
  }, [getVersions])

  useEffect(() => {
    getDocPermissions()
  }, [getDocPermissions])

  const value: DocumentInfoContext = {
    id,
    collectionSlug,
    docPermissions,
    getDocPermissions,
    getDocPreferences,
    getVersions,
    globalSlug,
    preferencesKey,
    publishedDoc,
    setDocFieldPreferences,
    slug,
    unpublishedVersions,
    versionsConfig,
    versions,
  }

  return <Context.Provider value={value}>{children}</Context.Provider>
}
