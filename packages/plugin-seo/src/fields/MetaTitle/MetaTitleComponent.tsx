'use client'

import type { FieldType, Options } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

import {
  CheckboxInput,
  FieldLabel,
  TextInput,
  useAllFormFields,
  useConfig,
  useDebouncedCallback,
  useDocumentInfo,
  useField,
  useForm,
  useLocale,
  useTranslation,
} from '@payloadcms/ui'
import { reduceToSerializableFields } from '@payloadcms/ui/shared'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { PluginSEOTranslationKeys, PluginSEOTranslations } from '../../translations/index.js'
import type { GenerateTitle } from '../../types.js'

import { defaults } from '../../defaults.js'
import { LengthIndicator } from '../../ui/LengthIndicator.js'
import '../index.scss'

const { maxLength: maxLengthDefault, minLength: minLengthDefault } = defaults.title

type MetaTitleProps = {
  readonly hasGenerateTitleFn: boolean
} & TextFieldClientProps

export const MetaTitleComponent: React.FC<MetaTitleProps> = (props) => {
  const {
    field: { label, maxLength: maxLengthFromProps, minLength: minLengthFromProps, required },
    hasGenerateTitleFn,
    path,
    readOnly,
  } = props || {}

  const { t } = useTranslation<PluginSEOTranslations, PluginSEOTranslationKeys>()

  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const field: FieldType<string> = useField({ path } as Options)
  const { customComponents: { AfterInput, BeforeInput, Label } = {} } = field

  const locale = useLocale()
  const { getData } = useForm()
  const docInfo = useDocumentInfo()

  const minLength = minLengthFromProps || minLengthDefault
  const maxLength = maxLengthFromProps || maxLengthDefault

  const { errorMessage, setValue, showError, value } = field

  // State to track if auto-generate is enabled
  const [autoGenerateEnabled, setAutoGenerateEnabled] = useState<boolean>(false)

  // Track previous field values to detect changes
  const previousFields = useRef<Record<string, any>>({})

  // Get all form fields - this re-renders when ANY field changes
  const [fields] = useAllFormFields()

  const regenerateTitle = useCallback(async () => {
    if (!hasGenerateTitleFn) {
      return
    }

    const endpoint = `${serverURL}${api}/plugin-seo/generate-title`

    const genTitleResponse = await fetch(endpoint, {
      body: JSON.stringify({
        id: docInfo.id,
        collectionSlug: docInfo.collectionSlug,
        doc: getData(),
        docPermissions: docInfo.docPermissions,
        globalSlug: docInfo.globalSlug,
        hasPublishPermission: docInfo.hasPublishPermission,
        hasSavePermission: docInfo.hasSavePermission,
        initialData: docInfo.initialData,
        initialState: reduceToSerializableFields(docInfo.initialState),
        locale: typeof locale === 'object' ? locale?.code : locale,
        title: docInfo.title,
      } satisfies Omit<
        Parameters<GenerateTitle>[0],
        'collectionConfig' | 'globalConfig' | 'hasPublishedDoc' | 'req' | 'versionCount'
      >),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const { result: generatedTitle } = await genTitleResponse.json()

    setValue(generatedTitle || '')
  }, [
    hasGenerateTitleFn,
    serverURL,
    api,
    docInfo.id,
    docInfo.collectionSlug,
    docInfo.docPermissions,
    docInfo.globalSlug,
    docInfo.hasPublishPermission,
    docInfo.hasSavePermission,
    docInfo.initialData,
    docInfo.initialState,
    docInfo.title,
    getData,
    locale,
    setValue,
  ])

  const debouncedRegenerateTitle = useDebouncedCallback(regenerateTitle, 1000)

  // Listen for changes in form fields
  useEffect(() => {
    if (!autoGenerateEnabled || !fields) {
      return
    }

    // Skip regeneration if we only have changes to this field
    // This prevents infinite loops
    const changedFields = Object.entries(fields).filter(([fieldPath, fieldData]) => {
      // Skip our own field
      if (fieldPath === path) {
        return false
      }

      // Check if the field wasn't in previous state or has changed
      const prevField = previousFields.current[fieldPath]
      return !prevField || prevField.value !== fieldData?.value
    })

    // Only regenerate if fields other than ours have changed
    if (changedFields.length > 0) {
      debouncedRegenerateTitle()
    }

    // Update previous fields state
    previousFields.current = { ...fields }
  }, [fields, autoGenerateEnabled, path, debouncedRegenerateTitle])

  return (
    <div
      style={{
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          marginBottom: '5px',
          position: 'relative',
        }}
      >
        <div className="plugin-seo__field">
          {Label ?? <FieldLabel label={label} path={path} required={required} />}
          {hasGenerateTitleFn && (
            <React.Fragment>
              &nbsp; &mdash; &nbsp;
              <CheckboxInput
                checked={autoGenerateEnabled}
                className="inline-checkbox"
                label={t('plugin-seo:autoGenerate')}
                onToggle={(event) => {
                  const checked = event.target.checked
                  setAutoGenerateEnabled(checked)
                  if (checked) {
                    // Generate title immediately when enabled - don't debounce the initial generation
                    void regenerateTitle()
                  }
                }}
              />
            </React.Fragment>
          )}
        </div>
        <div
          style={{
            color: '#9A9A9A',
          }}
        >
          {t('plugin-seo:lengthTipTitle', { maxLength, minLength })}
          <a
            href="https://developers.google.com/search/docs/advanced/appearance/title-link#page-titles"
            rel="noopener noreferrer"
            target="_blank"
          >
            {t('plugin-seo:bestPractices')}
          </a>
          .
        </div>
      </div>
      <div
        style={{
          marginBottom: '10px',
          position: 'relative',
        }}
      >
        <TextInput
          AfterInput={AfterInput}
          BeforeInput={BeforeInput}
          Error={errorMessage}
          onChange={setValue}
          path={path}
          readOnly={readOnly || autoGenerateEnabled}
          required={required}
          showError={showError}
          style={{
            marginBottom: 0,
          }}
          value={value}
        />
      </div>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          width: '100%',
        }}
      >
        <LengthIndicator maxLength={maxLength} minLength={minLength} text={value} />
      </div>
    </div>
  )
}
