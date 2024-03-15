'use client'
// TODO: abstract the `next/navigation` dependency out from this component
import { useRouter } from 'next/navigation.js'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'

import type { Props } from './types.js'

import { useAllFormFields, useFormModified } from '../../forms/Form/context.js'
import reduceFieldsToValues from '../../forms/Form/reduceFieldsToValues.js'
import useDebounce from '../../hooks/useDebounce.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { formatTimeToNow } from '../../utilities/formatDate/index.js'
import './index.scss'

const baseClass = 'autosave'

const Autosave: React.FC<Props> = ({
  id,
  collection,
  global: globalDoc,
  publishedDocUpdatedAt,
}) => {
  const {
    routes: { admin, api },
    serverURL,
  } = useConfig()
  const { docConfig, getVersions, versions } = useDocumentInfo()
  const versionsConfig = docConfig?.versions

  const [fields] = useAllFormFields()
  const modified = useFormModified()
  const { code: locale } = useLocale()
  const router = useRouter()
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

  const createCollectionDoc = useCallback(async () => {
    const res = await fetch(
      `${serverURL}${api}/${collection.slug}?locale=${locale}&fallback-locale=null&depth=0&draft=true&autosave=true`,
      {
        body: JSON.stringify({}),
        credentials: 'include',
        headers: {
          'Accept-Language': i18n.language,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    )

    if (res.status === 201) {
      const json = await res.json()
      router.replace(`${admin}/collections/${collection.slug}/${json.doc.id}`, {
        // state: {
        //   data: json.doc,
        // },
      })
    } else {
      toast.error(t('error:autosaving'))
    }
  }, [i18n, serverURL, api, collection, locale, router, admin, t])

  useEffect(() => {
    // If no ID, but this is used for a collection doc,
    // Immediately save it and set lastSaved
    if (!id && collection) {
      void createCollectionDoc()
    }
  }, [id, collection, createCollectionDoc])

  // When debounced fields change, autosave
  useEffect(() => {
    const autosave = () => {
      if (modified) {
        setSaving(true)

        let url: string
        let method: string

        if (collection && id) {
          url = `${serverURL}${api}/${collection.slug}/${id}?draft=true&autosave=true&locale=${localeRef.current}`
          method = 'PATCH'
        }

        if (globalDoc) {
          url = `${serverURL}${api}/globals/${globalDoc.slug}?draft=true&autosave=true&locale=${localeRef.current}`
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
                setLastSaved(new Date().getTime())
                void getVersions()
              }
            }

            setSaving(false)
          }, 1000)
        }
      }
    }

    void autosave()
  }, [i18n, debouncedFields, modified, serverURL, api, collection, globalDoc, id, getVersions])

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
            distance: formatTimeToNow(lastSaved, i18n.language),
          })}
        </React.Fragment>
      )}
    </div>
  )
}

export default Autosave
