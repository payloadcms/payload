'use client'
// TODO: abstract the `next/navigation` dependency out from this component
import type { ClientCollectionConfig, ClientGlobalConfig } from '@ruya.sa/payload'

import { dequal } from 'dequal/lite'
import {
  formatAdminURL,
  getAutosaveInterval,
  hasDraftValidationEnabled,
  reduceFieldsToValues,
} from '@ruya.sa/payload/shared'
import * as qs from 'qs-esm'
import React, { useDeferredValue, useEffect, useRef, useState } from 'react'

import type { OnSaveContext } from '../../views/Edit/index.js'

import {
  useAllFormFields,
  useForm,
  useFormModified,
  useFormSubmitted,
} from '../../forms/Form/context.js'
import { useDebounce } from '../../hooks/useDebounce.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { useQueue } from '../../hooks/useQueue.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { formatTimeToNow } from '../../utilities/formatDocTitle/formatDateTitle.js'
import { reduceFieldsToValuesWithValidation } from '../../utilities/reduceFieldsToValuesWithValidation.js'
import { LeaveWithoutSaving } from '../LeaveWithoutSaving/index.js'
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

export const Autosave: React.FC<Props> = ({ id, collection, global: globalDoc }) => {
  const {
    config: {
      routes: { api },
    },
  } = useConfig()

  const {
    docConfig,
    lastUpdateTime,
    mostRecentVersionIsAutosaved,
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
  } = useDocumentInfo()

  const { isValid, setBackgroundProcessing, submit } = useForm()

  const [formState] = useAllFormFields()
  const modified = useFormModified()
  const submitted = useFormSubmitted()

  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation()

  const interval = getAutosaveInterval(docConfig)
  const validateOnDraft = hasDraftValidationEnabled(docConfig)

  const [_saving, setSaving] = useState(false)

  const saving = useDeferredValue(_saving)

  const debouncedFormState = useDebounce(formState, interval)

  const { queueTask } = useQueue()

  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleAutosave = useEffectEvent(() => {
    autosaveTimeoutRef.current = undefined
    // We need to log the time in order to figure out if we need to trigger the state off later
    let startTimestamp = undefined
    let endTimestamp = undefined

    const hideIndicator = () => {
      // If request was faster than minimum animation time, animate the difference
      if (endTimestamp - startTimestamp < minimumAnimationTime) {
        autosaveTimeoutRef.current = setTimeout(
          () => {
            setSaving(false)
          },
          minimumAnimationTime - (endTimestamp - startTimestamp),
        )
      } else {
        stopAutoSaveIndicator()
      }
    }

    queueTask(
      async () => {
        if (modified) {
          startTimestamp = new Date().getTime()

          setSaving(true)

          let url: string
          let method: string
          let entitySlug: string
          const queryParams = qs.stringify(
            {
              autosave: true,
              depth: 0,
              draft: true,
              'fallback-locale': 'null',
              locale,
            },
            {
              addQueryPrefix: true,
            },
          )

          if (collection && id) {
            entitySlug = collection.slug
            url = formatAdminURL({
              apiRoute: api,
              path: `/${entitySlug}/${id}${queryParams}`,
            })
            method = 'PATCH'
          }

          if (globalDoc) {
            entitySlug = globalDoc.slug
            url = formatAdminURL({
              apiRoute: api,
              path: `/globals/${entitySlug}${queryParams}`,
            })
            method = 'POST'
          }

          const { valid } = reduceFieldsToValuesWithValidation(formState, true)

          const skipSubmission = submitted && !valid && validateOnDraft

          if (!skipSubmission && modified && url) {
            const result = await submit<any, OnSaveContext>({
              acceptValues: {
                overrideLocalChanges: false,
              },
              action: url,
              context: {
                getDocPermissions: false,
                incrementVersionCount: !mostRecentVersionIsAutosaved,
              },
              disableFormWhileProcessing: false,
              disableSuccessStatus: true,
              method,
              overrides: {
                _status: 'draft',
              },
              skipValidation: !validateOnDraft,
            })

            if (result && result?.res?.ok && !mostRecentVersionIsAutosaved) {
              setMostRecentVersionIsAutosaved(true)
              setUnpublishedVersionCount((prev) => prev + 1)
            }

            const newDate = new Date()

            // We need to log the time in order to figure out if we need to trigger the state off later
            endTimestamp = newDate.getTime()

            hideIndicator()
          }
        }
      },
      {
        afterProcess: () => {
          setBackgroundProcessing(false)
        },
        beforeProcess: () => {
          setBackgroundProcessing(true)
        },
      },
    )
  })

  const didMount = useRef(false)
  const previousDebouncedData = useRef(reduceFieldsToValues(debouncedFormState))

  // When debounced fields change, autosave
  useEffect(() => {
    /**
     * Ensure autosave doesn't run on mount
     */
    if (!didMount.current) {
      didMount.current = true
      return
    }

    /**
     * Ensure autosave only runs if the form data changes, not every time the entire form state changes
     * Remove `updatedAt` from comparison as it changes on every autosave interval.
     */
    const { updatedAt: _, ...formData } = reduceFieldsToValues(debouncedFormState)
    const { updatedAt: __, ...prevFormData } = previousDebouncedData.current

    if (dequal(formData, prevFormData)) {
      return
    }

    previousDebouncedData.current = formData

    handleAutosave()
  }, [debouncedFormState])

  /**
   * If component unmounts, clear the autosave timeout
   */
  useEffect(() => {
    return () => {
      stopAutoSaveIndicator()
    }
  }, [])

  const stopAutoSaveIndicator = useEffectEvent(() => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
    }

    setSaving(false)
  })

  return (
    <div className={baseClass}>
      {validateOnDraft && !isValid && <LeaveWithoutSaving />}
      {saving && t('general:saving')}
      {!saving && Boolean(lastUpdateTime) && (
        <React.Fragment>
          {t('version:lastSavedAgo', {
            distance: formatTimeToNow({ date: lastUpdateTime, i18n }),
          })}
        </React.Fragment>
      )}
    </div>
  )
}
