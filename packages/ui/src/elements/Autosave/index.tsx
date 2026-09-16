'use client'
import type { ClientCollectionConfig, ClientGlobalConfig, Data, FormState } from 'payload'

import { dequal } from 'dequal/lite'
import {
  formatAdminURL,
  getAutosaveInterval,
  hasDraftValidationEnabled,
  reduceFieldsToValues,
} from 'payload/shared'
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
import { reduceFieldsToValuesWithValidation } from '../../utilities/reduceFieldsToValuesWithValidation.js'
import { LeaveWithoutSaving } from '../LeaveWithoutSaving/index.js'
import './index.css'

const baseClass = 'autosave'
// The minimum time the saving state should be shown
const minimumAnimationTime = 1000

/**
 * Reduces form state to only the values that can represent a user edit, so that autosave can tell
 * a real change apart from one the server made to its own response.
 *
 * Excludes `updatedAt` and virtual fields (including anything nested beneath one). The server
 * recomputes both on every autosave and merges them back into form state. Comparing them would
 * make each autosave response look like a new change and schedule another, redundant autosave.
 */
const reduceFieldsToComparableValues = (formState: FormState): Data => {
  const virtualPathPrefixes: string[] = []

  for (const [path, field] of Object.entries(formState)) {
    if (field.isVirtual) {
      virtualPathPrefixes.push(`${path}.`)
    }
  }

  const comparableState: FormState = {}

  for (const [path, field] of Object.entries(formState)) {
    if (path === 'updatedAt' || field.isVirtual) {
      continue
    }

    if (virtualPathPrefixes.some((prefix) => path.startsWith(prefix))) {
      continue
    }

    comparableState[path] = field
  }

  return reduceFieldsToValues(comparableState)
}

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
    mostRecentVersionIsAutosaved,
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
  } = useDocumentInfo()

  const { isValid, setBackgroundProcessing, submit } = useForm()

  const [formState] = useAllFormFields()
  const modified = useFormModified()
  const submitted = useFormSubmitted()

  const currentLocale = useLocale()
  const locale = currentLocale?.code
  const { t } = useTranslation()

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
          const params = qs.stringify(
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
              path: `/${entitySlug}/${id}${params}`,
            })
            method = 'PATCH'
          }

          if (globalDoc) {
            entitySlug = globalDoc.slug
            url = formatAdminURL({
              apiRoute: api,
              path: `/globals/${entitySlug}${params}`,
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
  const previousDebouncedData = useRef(reduceFieldsToComparableValues(debouncedFormState))

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
     */
    const formData = reduceFieldsToComparableValues(debouncedFormState)

    if (dequal(formData, previousDebouncedData.current)) {
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
    <React.Fragment>
      {validateOnDraft && !isValid && <LeaveWithoutSaving />}
      {saving && <div className={baseClass}>{t('general:saving')}</div>}
    </React.Fragment>
  )
}
