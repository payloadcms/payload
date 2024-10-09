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
// The minimum time the saving state should be shown
const minimumAnimationTime = 1000

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
    config: {
      routes: { api },
      serverURL,
    },
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
  if (versionsConfig.drafts && versionsConfig.drafts.autosave) {
    interval = versionsConfig.drafts.autosave.interval
  }

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
    // We need to log the time in order to figure out if we need to trigger the state off later
    let startTimestamp = undefined
    let endTimestamp = undefined

    const autosave = () => {
      if (modified) {
        startTimestamp = new Date().getTime()

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
          if (modifiedRef.current) {
            const { data, valid } = {
              ...reduceFieldsToValuesWithValidation(fieldRef.current, true),
            }
            data._status = 'draft'
            const skipSubmission =
              submitted && !valid && versionsConfig?.drafts && versionsConfig?.drafts?.validate

            if (!skipSubmission) {
              void fetch(url, {
                body: JSON.stringify(data),
                credentials: 'include',
                headers: {
                  'Accept-Language': i18n.language,
                  'Content-Type': 'application/json',
                },
                method,
                signal: abortController.signal,
              })
                .then((res) => {
                  const newDate = new Date()
                  // We need to log the time in order to figure out if we need to trigger the state off later
                  endTimestamp = newDate.getTime()

                  if (res.status === 200) {
                    setLastSaved(newDate.getTime())

                    reportUpdate({
                      id,
                      entitySlug,
                      updatedAt: newDate.toISOString(),
                    })

                    void getVersions()
                  } else {
                    return res.json()
                  }
                })
                .then((json) => {
                  if (versionsConfig?.drafts && versionsConfig?.drafts?.validate && json?.errors) {
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
                })
                .then(() => {
                  // If request was faster than minimum animation time, animate the difference
                  if (endTimestamp - startTimestamp < minimumAnimationTime) {
                    autosaveTimeout = setTimeout(
                      () => {
                        setSaving(false)
                      },
                      minimumAnimationTime - (endTimestamp - startTimestamp),
                    )
                  } else {
                    setSaving(false)
                  }
                })
            }
          }
        }
      }
    }

    void autosave()

    return () => {
      if (autosaveTimeout) {
        clearTimeout(autosaveTimeout)
      }
      if (abortController.signal) {
        try {
          abortController.abort('Autosave closed early.')
        } catch (error) {
          // swallow error
        }
      }
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
      {!saving && Boolean(lastSaved) && (
        <React.Fragment>
          {t('version:lastSavedAgo', {
            distance: formatTimeToNow({ date: lastSaved, i18n }),
          })}
        </React.Fragment>
      )}
    </div>
  )
}
