'use client'
import type { PayloadRequest, TextFieldClient } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { text } from 'payload/shared'
import React, { useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { CopyToClipboard } from '../../../elements/CopyToClipboard/index.js'
import { GenerateConfirmation } from '../../../elements/GenerateConfirmation/index.js'
import { useFormFields } from '../../../forms/Form/context.js'
import { useField } from '../../../forms/useField/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

const path = 'apiKey'
const baseClass = 'api-key'
const fieldBaseClass = 'field-type'

export const APIKey: React.FC<{ readonly enabled: boolean; readonly readOnly?: boolean }> = ({
  enabled,
  readOnly,
}) => {
  const [initialAPIKey] = useState(uuidv4())
  const [highlightedField, setHighlightedField] = useState(false)
  const { i18n, t } = useTranslation()
  const { config, getEntityConfig } = useConfig()
  const { collectionSlug } = useDocumentInfo()

  const apiKey = useFormFields(([fields]) => (fields && fields[path]) || null)

  const apiKeyField: TextFieldClient = getEntityConfig({ collectionSlug })?.fields?.find(
    (field) => 'name' in field && field.name === 'apiKey',
  ) as TextFieldClient

  const validate = (val) =>
    text(val, {
      name: 'apiKey',
      type: 'text',
      blockData: {},
      data: {},
      event: 'onChange',
      maxLength: 48,
      minLength: 24,
      path: ['apiKey'],
      preferences: { fields: {} },
      req: {
        payload: {
          config,
        },
        t,
      } as unknown as PayloadRequest,
      siblingData: {},
    })

  const apiKeyValue = apiKey?.value

  const apiKeyLabel = useMemo(() => {
    let label: Record<string, string> | string = 'API Key'

    if (apiKeyField?.label) {
      label = apiKeyField.label
    }

    return getTranslation(label, i18n)
  }, [apiKeyField, i18n])

  const APIKeyLabel = useMemo(
    () => (
      <div className={`${baseClass}__label`}>
        <span>{apiKeyLabel}</span>
        <CopyToClipboard value={apiKeyValue as string} />
      </div>
    ),
    [apiKeyLabel, apiKeyValue],
  )

  const fieldType = useField({
    path: 'apiKey',
    validate,
  })

  const highlightField = () => {
    if (highlightedField) {
      setHighlightedField(false)
    }
    setTimeout(() => {
      setHighlightedField(true)
    }, 1)
  }

  const { setValue, value } = fieldType

  useEffect(() => {
    if (!apiKeyValue && enabled) {
      setValue(initialAPIKey)
    }
    if (!enabled && apiKeyValue) {
      setValue(null)
    }
  }, [apiKeyValue, enabled, setValue, initialAPIKey])

  useEffect(() => {
    if (highlightedField) {
      setTimeout(() => {
        setHighlightedField(false)
      }, 10000)
    }
  }, [highlightedField])

  if (!enabled) {
    return null
  }

  return (
    <React.Fragment>
      <div className={[fieldBaseClass, 'api-key', 'read-only'].filter(Boolean).join(' ')}>
        {APIKeyLabel}
        <input
          aria-label={apiKeyLabel}
          className={highlightedField ? 'highlight' : undefined}
          disabled
          id="apiKey"
          name="apiKey"
          type="text"
          value={(value as string) || ''}
        />
      </div>
      {!readOnly && (
        <GenerateConfirmation highlightField={highlightField} setKey={() => setValue(uuidv4())} />
      )}
    </React.Fragment>
  )
}
