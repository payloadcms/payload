'use client'
// TODO: abstract the `next/navigation` dependency out from this component
import type { ClientCollectionConfig, ClientGlobalConfig } from 'payload/types'

import React, { useEffect, useRef, useState } from 'react'

import { useAllFormFields, useFormModified } from '../../forms/Form/context.js'
import { useDebounce } from '../../hooks/useDebounce.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentEvents } from '../../providers/DocumentEvents/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { formatTimeToNow } from '../../utilities/formatDate.js'
import { reduceFieldsToValues } from '../../utilities/reduceFieldsToValues.js'
import './index.scss'

const baseClass = 'autosave'

export type Props = {
  collection?: ClientCollectionConfig
  global?: ClientGlobalConfig
  id?: number | string
  publishedDocUpdatedAt: string
}

export const Autosave: React.FC<Props> = ({
  id,
  collection,
  global: globalDoc,
  publishedDocUpdatedAt,
}) => {
  const {
    routes: { api },
    serverURL,
  } = useConfig()
  const { docConfig, getVersions, versions } = useDocumentInfo()
  const { reportUpdate } = useDocumentEvents()
  const versionsConfig = docConfig?.versions

  const [fields] = useAllFormFields()
  const modified = useFormModified()
  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation()

  let interval = 800
  if (versionsConfig.drafts && versionsConfig?.drafts?.autosave)
    interval = versionsConfig.drafts.autosave.interval

  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<number>()
  const debouncedFields = useDebounce(fields, interval)
  const fieldRef = useRef(fields)
  const modifiedRef = useRef(modified)
  const localeRef = useRef(locale)

  // Store fields in ref so the autosave func
  // can always retrieve the most to date copies
  // after the timeout has executed
  fieldRef.current = fields

  // Store modified in ref so the autosave func
  // can bail out if modified becomes false while
  // timing out during autosave
  modifiedRef.current = modified

  // Store locale in ref so the autosave func
  // can always retrieve the most to date locale
  localeRef.current = locale

  // When debounced fields change, autosave
  useEffect(() => {
    const autosave = () => {
      if (modified) {
        setSaving(true)

        let url: string
        let method: string
        let entitySlug: string

        if (collection && id) {
          entitySlug = collection.slug
          url = `${serverURL}${api}/${entitySlug}/${id}?draft=true&autosave=true&locale=${localeRef.current}`
          method = 'PATCH'
        }

        if (globalDoc) {
          entitySlug = globalDoc.slug
          url = `${serverURL}${api}/globals/${entitySlug}?draft=true&autosave=true&locale=${localeRef.current}`
          method = 'POST'
        }

        if (url) {
          setTimeout(async () => {
            if (modifiedRef.current) {
              const body = {
                ...reduceFieldsToValues(fieldRef.current, true),
                _status: 'draft',
              }
              const res = await fetch(url, {
                body: JSON.stringify(body),
                credentials: 'include',
                headers: {
                  'Accept-Language': i18n.language,
                  'Content-Type': 'application/json',
                },
                method,
              })

              if (res.status === 200) {
                const newDate = new Date()
                setLastSaved(newDate.getTime())
                reportUpdate({
                  id,
                  entitySlug,
                  updatedAt: newDate.toISOString(),
                })
                void getVersions()
              }
            }

            setSaving(false)
          }, 1000)
        }
      }
    }

    void autosave()
  }, [
    i18n,
    debouncedFields,
    modified,
    serverURL,
    api,
    collection,
    globalDoc,
    reportUpdate,
    id,
    getVersions,
  ])

  useEffect(() => {
    if (versions?.docs?.[0]) {
      setLastSaved(new Date(versions.docs[0].updatedAt).getTime())
    } else if (publishedDocUpdatedAt) {
      setLastSaved(new Date(publishedDocUpdatedAt).getTime())
    }
  }, [publishedDocUpdatedAt, versions])

  return (
    <div className={baseClass}>
      {saving && t('general:saving')}
      {!saving && lastSaved && (
        <React.Fragment>
          {t('version:lastSavedAgo', {
            distance: formatTimeToNow({ date: lastSaved, i18n }),
          })}
        </React.Fragment>
      )}
    </div>
  )
}
