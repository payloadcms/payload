'use client'
// TODO: abstract the `next/navigation` dependency out from this component
import type { ClientCollectionConfig, ClientGlobalConfig } from 'payload'

import { versionDefaults } from 'payload/shared'
import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  useAllFormFields,
  useForm,
  useFormModified,
  useFormSubmitted,
} from '../../forms/Form/context.js'
import { useDebounce } from '../../hooks/useDebounce.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentEvents } from '../../providers/DocumentEvents/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { formatTimeToNow } from '../../utilities/formatDate.js'
import { reduceFieldsToValuesWithValidation } from '../../utilities/reduceFieldsToValuesWithValidation.js'
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
  const { dispatchFields, setSubmitted } = useForm()
  const submitted = useFormSubmitted()
  const versionsConfig = docConfig?.versions

  const [fields] = useAllFormFields()
  const formModified = useFormModified()
  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation()

  let interval = versionDefaults.autosaveInterval
  if (versionsConfig.drafts && versionsConfig.drafts.autosave)
    interval = versionsConfig.drafts.autosave.interval

  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<number>()
  const debouncedFields = useDebounce(fields, interval)
  const modified = useDebounce(formModified, interval)
  const fieldRef = useRef(fields)
  const modifiedRef = useRef(modified)
  const localeRef = useRef(locale)
  const debouncedRef = useRef(debouncedFields)

  debouncedRef.current = debouncedFields

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
    const abortController = new AbortController()
    let autosaveTimeout = undefined

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
          autosaveTimeout = setTimeout(async () => {
            if (modifiedRef.current) {
              const { data, valid } = {
                ...reduceFieldsToValuesWithValidation(fieldRef.current, true),
              }
              data._status = 'draft'
              const skipSubmission =
                submitted && !valid && versionsConfig?.drafts && versionsConfig?.drafts?.validate

              if (!skipSubmission) {
                const res = await fetch(url, {
                  body: JSON.stringify(data),
                  credentials: 'include',
                  headers: {
                    'Accept-Language': i18n.language,
                    'Content-Type': 'application/json',
                  },
                  method,
                  signal: abortController.signal,
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

                if (
                  versionsConfig?.drafts &&
                  versionsConfig?.drafts?.validate &&
                  res.status === 400
                ) {
                  const json = await res.json()
                  if (Array.isArray(json.errors)) {
                    const [fieldErrors, nonFieldErrors] = json.errors.reduce(
                      ([fieldErrs, nonFieldErrs], err) => {
                        const newFieldErrs = []
                        const newNonFieldErrs = []

                        if (err?.message) {
                          newNonFieldErrs.push(err)
                        }

                        if (Array.isArray(err?.data)) {
                          err.data.forEach((dataError) => {
                            if (dataError?.field) {
                              newFieldErrs.push(dataError)
                            } else {
                              newNonFieldErrs.push(dataError)
                            }
                          })
                        }

                        return [
                          [...fieldErrs, ...newFieldErrs],
                          [...nonFieldErrs, ...newNonFieldErrs],
                        ]
                      },
                      [[], []],
                    )

                    dispatchFields({
                      type: 'ADD_SERVER_ERRORS',
                      errors: fieldErrors,
                    })

                    nonFieldErrors.forEach((err) => {
                      toast.error(err.message || i18n.t('error:unknown'))
                    })

                    setSubmitted(true)
                    setSaving(false)
                    return
                  }
                }
              }
            }

            setSaving(false)
          }, 1000)
        }
      }
    }

    void autosave()

    return () => {
      clearTimeout(autosaveTimeout)
      if (abortController.signal) abortController.abort()
      setSaving(false)
    }
  }, [
    api,
    collection,
    dispatchFields,
    getVersions,
    globalDoc,
    i18n,
    id,
    interval,
    modified,
    reportUpdate,
    serverURL,
    setSubmitted,
    versionsConfig?.drafts,
    debouncedFields,
    submitted,
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
