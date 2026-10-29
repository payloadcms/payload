'use client'
import type { ClientCollectionConfig, ClientGlobalConfig } from 'payload'

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

import { useAllFormFields, useForm, useFormModified } from '../../forms/Form/context.js'
import { useDebounce } from '../../hooks/useDebounce.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useUploadEdits } from '../../providers/UploadEdits/index.js'
import { LeaveWithoutSaving } from '../LeaveWithoutSaving/index.js'
import './index.css'

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
    mostRecentVersionIsAutosaved,
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
  } = useDocumentInfo()

  const { getFields, isValid, submit } = useForm()

  const [formState] = useAllFormFields()
  const modified = useFormModified()

  const currentLocale = useLocale()
  const locale = currentLocale?.code
  const { t } = useTranslation()
  const { uploadEdits } = useUploadEdits()

  const interval = getAutosaveInterval(docConfig)
  const validateOnDraft = hasDraftValidationEnabled(docConfig)

  const [_saving, setSaving] = useState(false)

  const saving = useDeferredValue(_saving)

  const debouncedFormState = useDebounce(formState, interval)

  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const outstandingSubmitCountRef = useRef(0)
  const autosaveSequenceRef = useRef(0)
  const retryAutosaveRef = useRef<(() => Promise<void>) | null>(null)
  const savingStartTimestampRef = useRef(0)

  const didMount = useRef(false)
  const previousDebouncedData = useRef(reduceFieldsToValues(debouncedFormState))
  const previousUploadEdits = useRef(uploadEdits)

  const stopAutoSaveIndicator = useEffectEvent(() => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
    }

    setSaving(false)
  })

  const handleAutosave = useEffectEvent(async () => {
    if (!modified) {
      return
    }

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
        uploadEdits: uploadEdits || undefined,
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

    if (!url) {
      return
    }

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
    }

    savingStartTimestampRef.current = Date.now()
    const autosaveSequence = ++autosaveSequenceRef.current
    outstandingSubmitCountRef.current += 1
    setSaving(true)

    try {
      const result = await submit<any, OnSaveContext>({
        acceptValues: true,
        action: url,
        context: {
          getDocPermissions: false,
          incrementVersionCount: !mostRecentVersionIsAutosaved,
        },
        disableFormWhileProcessing: false,
        disableSuccessStatus: true,
        method,
        onStaleRequest: () => {
          if (autosaveSequence === autosaveSequenceRef.current) {
            previousDebouncedData.current = reduceFieldsToValues(getFields())
            previousUploadEdits.current = uploadEdits
            void retryAutosaveRef.current?.()
          }
        },
        overrides: { _status: 'draft' },
        requestIntent: 'autosave',
        skipValidation: !validateOnDraft,
      })

      if (result && result.res?.ok && !mostRecentVersionIsAutosaved) {
        setMostRecentVersionIsAutosaved(true)
        setUnpublishedVersionCount((prev) => prev + 1)
      }
    } catch (err) {
      console.error('Error autosaving form:', err) // eslint-disable-line no-console
    } finally {
      outstandingSubmitCountRef.current -= 1

      if (outstandingSubmitCountRef.current === 0) {
        const completedSequence = autosaveSequenceRef.current
        const hideIndicator = () => {
          if (
            outstandingSubmitCountRef.current === 0 &&
            completedSequence === autosaveSequenceRef.current
          ) {
            stopAutoSaveIndicator()
          }
        }
        const remainingAnimationTime =
          minimumAnimationTime - (Date.now() - savingStartTimestampRef.current)

        if (remainingAnimationTime > 0) {
          autosaveTimeoutRef.current = setTimeout(hideIndicator, remainingAnimationTime)
        } else {
          hideIndicator()
        }
      }
    }
  })

  useEffect(() => {
    retryAutosaveRef.current = handleAutosave

    return () => {
      retryAutosaveRef.current = null
    }
  }, [handleAutosave])

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

    if (dequal(formData, prevFormData) && dequal(uploadEdits, previousUploadEdits.current)) {
      return
    }

    previousDebouncedData.current = formData
    previousUploadEdits.current = uploadEdits

    void handleAutosave()
  }, [debouncedFormState, uploadEdits])

  /**
   * If component unmounts, clear the autosave timeout
   */
  useEffect(() => {
    return () => {
      stopAutoSaveIndicator()
    }
  }, [])

  return (
    <React.Fragment>
      {validateOnDraft && !isValid && <LeaveWithoutSaving />}
      {saving && <div className={baseClass}>{t('general:saving')}</div>}
    </React.Fragment>
  )
}
