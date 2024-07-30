import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { toast } from 'react-toastify'

import type { Props } from './types'

import useDebounce from '../../../hooks/useDebounce'
import { formatTimeToNow } from '../../../utilities/formatDate'
import {
  useAllFormFields,
  useForm,
  useFormModified,
  useFormSubmitted,
} from '../../forms/Form/context'
import reduceFieldsToValues from '../../forms/Form/reduceFieldsToValues'
import { reduceFieldsToValuesWithValidation } from '../../forms/Form/reduceFieldsToValuesWithValidation'
import { useConfig } from '../../utilities/Config'
import { useDocumentInfo } from '../../utilities/DocumentInfo'
import { useEditDepth } from '../../utilities/EditDepth'
import { useLocale } from '../../utilities/Locale'
import './index.scss'
const baseClass = 'autosave'

const Autosave: React.FC<Props> = ({ id, collection, global, onSave, publishedDocUpdatedAt }) => {
  const {
    routes: { admin, api },
    serverURL,
  } = useConfig()
  const { getVersions, versions } = useDocumentInfo()
  const [fields] = useAllFormFields()
  const modified = useFormModified()
  const { code: locale } = useLocale()
  const submitted = useFormSubmitted()
  const { dispatchFields, setSubmitted } = useForm()
  const history = useHistory()
  const { i18n, t } = useTranslation('version')
  const depth = useEditDepth()

  let interval = 800
  const validateDrafts =
    (collection?.versions.drafts && collection.versions?.drafts?.validate) ||
    (global?.versions.drafts && global.versions?.drafts?.validate)
  if (collection?.versions.drafts && collection.versions?.drafts?.autosave)
    interval = collection.versions.drafts.autosave.interval
  if (global?.versions.drafts && global.versions?.drafts?.autosave)
    interval = global.versions.drafts.autosave.interval

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
      if (depth === 1) {
        history.replace(`${admin}/collections/${collection.slug}/${json.doc.id}`, {
          state: {
            data: json.doc,
          },
        })
      } else {
        onSave(json)
      }
    } else {
      toast.error(t('error:autosaving'))
    }
  }, [serverURL, api, collection?.slug, locale, i18n.language, history, admin, t, depth, onSave])

  useEffect(() => {
    // If no ID, but this is used for a collection doc,
    // Immediately save it and set lastSaved
    if (!id && collection) {
      void createCollectionDoc()
    }
  }, [id, collection, createCollectionDoc])

  // When debounced fields change, autosave

  useEffect(() => {
    const abortController = new AbortController()
    let autosaveTimeout = undefined

    const autosave = async () => {
      if (modified) {
        setSaving(true)

        let url: string
        let method: string

        if (collection && id) {
          url = `${serverURL}${api}/${collection.slug}/${id}?draft=true&autosave=true&locale=${localeRef.current}`
          method = 'PATCH'
        }

        if (global) {
          url = `${serverURL}${api}/globals/${global.slug}?draft=true&autosave=true&locale=${localeRef.current}`
          method = 'POST'
        }

        if (url) {
          autosaveTimeout = setTimeout(async () => {
            if (modifiedRef.current) {
              const { data, valid } = {
                ...reduceFieldsToValuesWithValidation(fieldRef.current, true),
              }
              data._status = 'draft'
              const skipSubmission = submitted && !valid && validateDrafts

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
                  void getVersions()
                }

                if (validateDrafts && res.status === 400) {
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

                    fieldErrors.forEach((err) => {
                      dispatchFields({
                        type: 'UPDATE',
                        errorMessage: err.message,
                        path: err.field,
                        valid: false,
                      })
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

    return () => {
      clearTimeout(autosaveTimeout)
      if (abortController.signal) abortController.abort()
      setSaving(false)
    }
  }, [
    i18n,
    debouncedFields,
    modified,
    serverURL,
    api,
    collection,
    global,
    id,
    getVersions,
    localeRef,
    modifiedRef,
    submitted,
    validateDrafts,
    setSubmitted,
    dispatchFields,
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
      {saving && t('saving')}
      {!saving && lastSaved && (
        <React.Fragment>
          {t('lastSavedAgo', {
            distance: formatTimeToNow(lastSaved, i18n.language),
          })}
        </React.Fragment>
      )}
    </div>
  )
}

export default Autosave
