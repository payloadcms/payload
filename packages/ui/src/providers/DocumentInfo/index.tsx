'use client'
import type { PaginatedDocs, TypeWithVersion } from 'payload/database'
import type { FormState, TypeWithTimestamps } from 'payload/types'
import type { DocumentPermissions, DocumentPreferences, TypeWithID, Where } from 'payload/types'

import { LoadingOverlay } from '@payloadcms/ui/elements/Loading'
import usePayloadAPI from '@payloadcms/ui/hooks/usePayloadAPI'
import { formatDocTitle } from '@payloadcms/ui/utilities/formatDocTitle'
import { getFormState } from '@payloadcms/ui/utilities/getFormState'
import qs from 'qs'
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

import type { DocumentInfoContext, DocumentInfoProps } from './types.js'

import { useAuth } from '../Auth/index.js'
import { useConfig } from '../Config/index.js'
import { useLocale } from '../Locale/index.js'
import { usePreferences } from '../Preferences/index.js'
import { useTranslation } from '../Translation/index.js'

const Context = createContext({} as DocumentInfoContext)

export type * from './types.js'

export const useDocumentInfo = (): DocumentInfoContext => useContext(Context)

export const DocumentInfoProvider: React.FC<
  DocumentInfoProps & {
    children: React.ReactNode
  }
> = ({ children, initialState: initialStateFromProps, title: titleFromProps, ...props }) => {
  const [documentTitle, setDocumentTitle] = useState(titleFromProps)

  const [initialState, setInitialState] = useState<FormState>(initialStateFromProps)

  const { id, collectionSlug, globalSlug, initialData: initialDataFromProps } = props

  const {
    admin: { dateFormat },
    collections,
    globals,
    routes: { api },
    serverURL,
  } = useConfig()

  const collectionConfig = collections.find((c) => c.slug === collectionSlug)
  const globalConfig = globals.find((g) => g.slug === globalSlug)
  const docConfig = collectionConfig || globalConfig
  const versionsConfig = docConfig?.versions

  const { getPreference, setPreference } = usePreferences()
  const { i18n } = useTranslation()
  const { permissions } = useAuth()
  const { code } = useLocale()
  const [publishedDoc, setPublishedDoc] = useState<TypeWithID & TypeWithTimestamps>(null)
  const [versions, setVersions] = useState<PaginatedDocs<TypeWithVersion<any>>>(null)
  const [docPermissions, setDocPermissions] = useState<DocumentPermissions>(null)
  const [hasSavePermission, setHasSavePermission] = useState<boolean>(null)

  const [unpublishedVersions, setUnpublishedVersions] =
    useState<PaginatedDocs<TypeWithVersion<any>>>(null)

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

  /**
   *
   *
   * Fetching state from Server on the Client. Should be moved back to Document/index.tsx once next allows us to disable the router cache
   *
   *
   */
  const hasInitializedState = useRef(!!initialStateFromProps)

  // no need to an additional requests when creating new documents
  const isEditing = Boolean(id)

  const shouldLoadData = !hasInitializedState.current && !!(globalSlug || id)

  const [{ data, isError, isLoading: isLoadingDocument }] = usePayloadAPI(
    shouldLoadData
      ? `${baseURL}/${globalSlug ? 'globals/' : ''}${slug}${collectionSlug ? `/${id}` : ''}`
      : null,
    {
      initialData: initialDataFromProps,
      initialParams: { depth: 0, draft: 'true', 'fallback-locale': 'null' },
    },
  )

  useEffect(() => {
    if (!hasInitializedState.current && (data || !shouldLoadData)) {
      const getInitialState = async () => {
        let docPreferences: DocumentPreferences = { fields: {} }

        if (id) {
          docPreferences = await getPreference(
            `${id ? 'collection' : 'global'}-${collectionSlug}-${id}`,
          )
        }

        const result = await getFormState({
          apiRoute: api,
          body: {
            id,
            collectionSlug,
            data: data || {},
            docPreferences,
            globalSlug,
            operation: isEditing ? 'update' : 'create',
            schemaPath: collectionSlug || globalSlug,
          },
          serverURL,
        })

        setInitialState(result)
        hasInitializedState.current = true
      }

      void getInitialState()
    }
  }, [api, data, isEditing, collectionSlug, serverURL, id, getPreference, globalSlug])

  /**
   *
   *
   * Fetching state from Server on the Client DONE
   *
   *
   */

  const getVersions = useCallback(async () => {
    let versionFetchURL
    let publishedFetchURL
    const shouldFetchVersions = Boolean(versionsConfig)
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
      setHasSavePermission(json?.update?.permission)
    } else {
      // fallback to permissions from the entity type
      // (i.e. create has no id)
      setDocPermissions(permissions?.[pluralType]?.[slug])
      setHasSavePermission(permissions?.[pluralType]?.[slug]?.update?.permission)
    }
  }, [serverURL, api, pluralType, slug, id, permissions, i18n.language, code])

  const getDocPreferences = useCallback(() => {
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
          console.error(e) // eslint-disable-line no-console
        }
      }
    },
    [setPreference, preferencesKey, getDocPreferences],
  )

  useEffect(() => {
    void getVersions()
  }, [getVersions])

  useEffect(() => {
    if (titleFromProps) {
      setDocumentTitle(titleFromProps)
    } else {
      setDocumentTitle(
        formatDocTitle({
          collectionConfig,
          data,
          dateFormat,
          fallback: id?.toString(),
          globalConfig,
          i18n,
        }),
      )
    }
  }, [collectionConfig, data, dateFormat, i18n, titleFromProps, id, globalConfig])

  useEffect(() => {
    const loadDocPermissions = async () => {
      const docPermissions: DocumentPermissions = props.docPermissions
      const hasSavePermission: boolean = props.hasSavePermission

      if (!docPermissions || hasSavePermission === undefined || hasSavePermission === null) {
        await getDocPermissions()
      } else {
        setDocPermissions(docPermissions)
        setHasSavePermission(hasSavePermission)
      }
    }

    if (collectionSlug || globalSlug) {
      void loadDocPermissions()
    }
  }, [
    getDocPermissions,
    props.docPermissions,
    props.hasSavePermission,
    setDocPermissions,
    collectionSlug,
    globalSlug,
  ])

  if (!initialState || isLoadingDocument) {
    return <LoadingOverlay />
  }

  if (isError) return null

  const value: DocumentInfoContext = {
    ...props,
    data,
    docConfig,
    docPermissions,
    getDocPermissions,
    getDocPreferences,
    getVersions,
    hasSavePermission,
    initialState,
    onSave: props.onSave,
    publishedDoc,
    setDocFieldPreferences,
    setDocumentTitle,
    title: documentTitle,
    unpublishedVersions,
    versions,
  }

  return <Context.Provider value={value}>{children}</Context.Provider>
}
