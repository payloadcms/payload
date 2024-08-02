'use client'
import type { PayloadRequest } from 'payload'

import {
  CopyToClipboard,
  FieldLabel,
  GenerateConfirmation,
  useConfig,
  useField,
  useFormFields,
  useTranslation,
} from '@payloadcms/ui'
import { text } from 'payload/shared'
import React, { useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

const path = 'apiKey'
const baseClass = 'api-key'
const fieldBaseClass = 'field-type'

export const APIKey: React.FC<{ enabled: boolean; readOnly?: boolean }> = ({
  enabled,
  readOnly,
}) => {
  const [initialAPIKey] = useState(uuidv4())
  const [highlightedField, setHighlightedField] = useState(false)
  const { t } = useTranslation()
  const { config } = useConfig()

  const apiKey = useFormFields(([fields]) => (fields && fields[path]) || null)

  const validate = (val) =>
    text(val, {
      name: 'apiKey',
      type: 'text',
      data: {},
      maxLength: 48,
      minLength: 24,
      preferences: { fields: {} },
      req: {
        payload: {
          config,
        },
        t,
      } as PayloadRequest,
      siblingData: {},
    })

  const apiKeyValue = apiKey?.value

  const APIKeyLabel = useMemo(
    () => (
      <div className={`${baseClass}__label`}>
        <span>API Key</span>
        <CopyToClipboard value={apiKeyValue as string} />
      </div>
    ),
    [apiKeyValue],
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
        <FieldLabel
          CustomLabel={{
            type: 'client',
            Component: null,
            RenderedComponent: APIKeyLabel,
          }}
          htmlFor={path}
        />
        <input
          aria-label="API Key"
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
