import qs from 'qs'
import QueryString from 'qs'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import type { TypeWithTimestamps } from '../../../../collections/config/types'
import type { PaginatedDocs } from '../../../../database/types'
import type { TypeWithID } from '../../../../globals/config/types'
import type { DocumentPreferences } from '../../../../preferences/types'
import type { Where } from '../../../../types'
import type { ContextType, DocumentPermissions, Props, Version } from './types'

import { useAuth } from '../Auth'
import { useConfig } from '../Config'
import { useLocale } from '../Locale'
import { usePreferences } from '../Preferences'
import { UploadEditsProvider, useUploadEdits } from '../UploadEdits'

const Context = createContext({} as ContextType)

export const useDocumentInfo = (): ContextType => useContext(Context)

const DocumentInfo: React.FC<Props> = ({
  id: idFromProps,
  children,
  collection,
  global,
  idFromParams: getIDFromParams,
}) => {
  const { id: idFromParams } = useParams<{ id: string }>()
  const id = idFromProps || (getIDFromParams ? idFromParams : null)

  const {
    routes: { api },
    serverURL,
  } = useConfig()
  const { getPreference, setPreference } = usePreferences()
  const { i18n } = useTranslation()
  const { permissions } = useAuth()
  const { code } = useLocale()
  const { uploadEdits } = useUploadEdits()
  const [publishedDoc, setPublishedDoc] = useState<TypeWithID & TypeWithTimestamps>(null)
  const [versions, setVersions] = useState<PaginatedDocs<Version>>(null)
  const [unpublishedVersions, setUnpublishedVersions] = useState<PaginatedDocs<Version>>(null)

  const baseURL = `${serverURL}${api}`
  let slug: string
  let pluralType: 'collections' | 'globals'
  let preferencesKey: string

  if (global) {
    slug = global.slug
    pluralType = 'globals'
    preferencesKey = `global-${slug}`
  }

  if (collection) {
    slug = collection.slug
    pluralType = 'collections'

    if (id) {
      preferencesKey = `collection-${slug}-${id}`
    }
  }

  const [docPermissions, setDocPermissions] = useState<DocumentPermissions>(
    permissions[pluralType][slug],
  )

  const getVersions = useCallback(async () => {
    let versionFetchURL
    let publishedFetchURL
    let draftsEnabled = false
    let shouldFetchVersions = false
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

    if (global) {
      draftsEnabled = Boolean(global?.versions?.drafts)
      shouldFetchVersions = Boolean(global?.versions)
      versionFetchURL = `${baseURL}/globals/${global.slug}/versions`
      publishedFetchURL = `${baseURL}/globals/${global.slug}?${qs.stringify(
        publishedVersionParams,
      )}`
    }

    if (collection) {
      draftsEnabled = Boolean(collection?.versions?.drafts)
      shouldFetchVersions = Boolean(collection?.versions)
      versionFetchURL = `${baseURL}/${collection.slug}/versions`

      publishedVersionParams.where.and.push({
        id: {
          equals: id,
        },
      })

      publishedFetchURL = `${baseURL}/${collection.slug}?${qs.stringify(publishedVersionParams)}`

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

      if (draftsEnabled) {
        publishedJSON = await fetch(publishedFetchURL, {
          credentials: 'include',
          headers: {
            'Accept-Language': i18n.language,
          },
        }).then((res) => res.json())

        if (collection) {
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
  }, [i18n, global, collection, id, baseURL, code])

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
      try {
        const json = await res.json()
        setDocPermissions(json)
      } catch (e) {
        console.error('Unable to fetch document permissions', e)
      }
    }
  }, [serverURL, api, pluralType, slug, id, i18n.language, code])

  const getDocPreferences = useCallback(async () => {
    return getPreference<DocumentPreferences>(preferencesKey)
  }, [getPreference, preferencesKey])

  const setDocFieldPreferences = useCallback<ContextType['setDocFieldPreferences']>(
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
    void getVersions()
  }, [getVersions])

  useEffect(() => {
    void getDocPermissions()
  }, [getDocPermissions])

  const action: string = React.useMemo(() => {
    const docURL = `${baseURL}${pluralType === 'globals' ? `/globals` : ''}/${slug}${id ? `/${id}` : ''}`
    const params = {
      depth: 0,
      'fallback-locale': 'null',
      locale: code,
      uploadEdits: uploadEdits || undefined,
    }

    return `${docURL}${QueryString.stringify(params, {
      addQueryPrefix: true,
    })}`
  }, [baseURL, code, pluralType, id, slug, uploadEdits])

  const value: ContextType = {
    id,
    slug,
    action,
    collection,
    docPermissions,
    getDocPermissions,
    getDocPreferences,
    getVersions,
    global,
    preferencesKey,
    publishedDoc,
    setDocFieldPreferences,
    unpublishedVersions,
    versions,
  }

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const DocumentInfoProvider: React.FC<Props> = (props) => {
  return (
    <UploadEditsProvider>
      <DocumentInfo {...props} />
    </UploadEditsProvider>
  )
}
