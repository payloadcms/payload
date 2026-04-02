'use client'
import type { ReactSelectOption } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  ReactSelect,
  useConfig,
  useDocumentInfo,
  useField,
  useTranslation,
} from '@payloadcms/ui'
import { useCallback, useEffect, useMemo } from 'react'

import { useImportExport } from '../ImportExportProvider/index.js'

type CollectionSelectFieldProps = {
  textFieldProps: TextFieldClientProps
}

/**
 * Custom component for rendering a collection slug selector.
 * Uses FieldLabel and ReactSelect directly for better control over the field.
 *
 * Used by both export and import collection field components.
 */
export function CollectionSelectField({ textFieldProps }: CollectionSelectFieldProps) {
  const { field, path, readOnly: readOnlyFromProps } = textFieldProps
  const { label, required } = field

  const { id: docId, docConfig, initialData } = useDocumentInfo()
  const { config } = useConfig()
  const { setValue, showError, value } = useField<string>({ path })
  const { collection: collectionFromContext } = useImportExport()
  const { i18n } = useTranslation()

  const fieldId = path ? `field-${path.replace(/\./g, '__')}` : undefined

  const options = useMemo(() => {
    const validSlugs = (docConfig?.admin?.custom?.['plugin-import-export']?.collectionSlugs ||
      []) as string[]

    const slugsToUse = validSlugs.length > 0 ? validSlugs : config.collections.map((c) => c.slug)

    return slugsToUse.map((slug) => {
      const collectionConfig = config.collections.find((c) => c.slug === slug)
      const labelSource =
        collectionConfig?.labels?.plural || collectionConfig?.labels?.singular || slug
      return {
        label: getTranslation(labelSource, i18n),
        value: slug,
      }
    })
  }, [docConfig?.admin?.custom, config.collections, i18n])

  const presetValue = useMemo(() => {
    if (initialData?.collectionSlug) {
      return initialData.collectionSlug as string
    }
    if (collectionFromContext) {
      return collectionFromContext
    }
    return null
  }, [initialData?.collectionSlug, collectionFromContext])

  // Determine if field should be readonly:
  // - Explicit readOnly from props
  // - Existing document (has ID)
  // - Only one option available
  // - Preset value from drawer/context
  const isReadOnly = useMemo(() => {
    if (readOnlyFromProps) {
      return true
    }
    if (docId) {
      return true
    }
    if (options.length === 1) {
      return true
    }
    if (presetValue) {
      return true
    }
    return false
  }, [readOnlyFromProps, docId, options.length, presetValue])

  useEffect(() => {
    if (docId) {
      return
    }

    if (presetValue && value !== presetValue) {
      setValue(presetValue)
      return
    }

    if (!value && options.length > 0 && options[0]?.value) {
      setValue(options[0].value)
    }
  }, [docId, presetValue, value, options, setValue])

  const selectedOption = useMemo((): ReactSelectOption | undefined => {
    if (!value) {
      return undefined
    }

    const found = options.find((opt) => opt.value === value)
    if (found) {
      return found
    }

    return { label: value, value }
  }, [value, options])

  const handleChange = useCallback(
    (selected: ReactSelectOption | ReactSelectOption[]) => {
      if (Array.isArray(selected)) {
        setValue(selected[0]?.value ?? '')
      } else {
        setValue(selected?.value ?? '')
      }
    },
    [setValue],
  )

  return (
    <div
      className={['field-type', 'select', showError && 'error', isReadOnly && 'read-only']
        .filter(Boolean)
        .join(' ')}
      id={fieldId}
    >
      <FieldLabel label={label} path={path} required={required} />
      <div className="field-type__wrap">
        <FieldError path={path} showError={showError} />
        <ReactSelect
          disabled={isReadOnly}
          isClearable={false}
          isSearchable={!isReadOnly && options.length > 5}
          onChange={handleChange}
          options={options}
          showError={showError}
          value={selectedOption}
        />
      </div>
      <FieldDescription description={field.admin?.description} path={path} />
    </div>
  )
}
