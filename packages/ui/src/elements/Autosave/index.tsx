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

import {
  useAllFormFields,
  useForm,
  useFormModified,
  useFormSubmitted,
} from '../../forms/Form/context.js'
import { useDebounce } from '../../hooks/useDebounce.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
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

  const { isValid, submit } = useForm()

  const [formState] = useAllFormFields()
  const modified = useFormModified()
  const submitted = useFormSubmitted()

  const { code: locale } = useLocale()
  const { t } = useTranslation()

  const interval = getAutosaveInterval(docConfig)
  const validateOnDraft = hasDraftValidationEnabled(docConfig)

  const [_saving, setSaving] = useState(false)

  const saving = useDeferredValue(_saving)

  const debouncedFormState = useDebounce(formState, interval)

  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const savingTokenRef = useRef(0)

  const handleAutosave = useEffectEvent(async () => {
    const hideIndicator = ({
      startTimestamp,
      token,
    }: {
      startTimestamp: number
      token: number
    }) => {
      const elapsedTime = new Date().getTime() - startTimestamp
      // If request was faster than minimum animation time, animate the difference
      if (elapsedTime < minimumAnimationTime) {
        autosaveTimeoutRef.current = setTimeout(() => {
          if (token === savingTokenRef.current) {
            setSaving(false)
          }
        }, minimumAnimationTime - elapsedTime)
      } else if (token === savingTokenRef.current) {
        stopAutoSaveIndicator()
      }
    }

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

    if (skipSubmission || !url) {
      return
    }

    const startTimestamp = new Date().getTime()
    const token = ++savingTokenRef.current
    setSaving(true)

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
      overrides: {
        _status: 'draft',
      },
      requestIntent: 'autosave',
      skipValidation: !validateOnDraft,
    })

    if (result && result?.res?.ok && !mostRecentVersionIsAutosaved) {
      setMostRecentVersionIsAutosaved(true)
      setUnpublishedVersionCount((prev) => prev + 1)
    }

    if (token === savingTokenRef.current) {
      hideIndicator({ startTimestamp, token })
    }
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

    void handleAutosave()
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
