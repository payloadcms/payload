'use client'
import type { PayloadRequestWithData } from 'payload/types'

import { CopyToClipboard } from '@payloadcms/ui/elements/CopyToClipboard'
import { GenerateConfirmation } from '@payloadcms/ui/elements/GenerateConfirmation'
import { FieldLabel } from '@payloadcms/ui/forms/FieldLabel'
import { useFormFields } from '@payloadcms/ui/forms/Form'
import { useField } from '@payloadcms/ui/forms/useField'
import { useConfig } from '@payloadcms/ui/providers/Config'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import { text } from 'payload/fields/validations'
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
  const config = useConfig()

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
      } as PayloadRequestWithData,
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
    if (!enabled) {
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
        <FieldLabel CustomLabel={APIKeyLabel} htmlFor={path} />
        <input
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
