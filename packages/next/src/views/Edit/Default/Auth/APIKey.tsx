'use client'
import type { PayloadRequest } from 'payload/types'

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

export const APIKey: React.FC<{ readOnly?: boolean }> = ({ readOnly }) => {
  const [initialAPIKey, setInitialAPIKey] = useState(null)
  const [highlightedField, setHighlightedField] = useState(false)
  const { t } = useTranslation()
  const config = useConfig()

  const apiKey = useFormFields(([fields]) => fields[path])

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
    setInitialAPIKey(uuidv4())
  }, [])

  useEffect(() => {
    if (!apiKeyValue) {
      setValue(initialAPIKey)
    }
  }, [apiKeyValue, setValue, initialAPIKey])

  useEffect(() => {
    if (highlightedField) {
      setTimeout(() => {
        setHighlightedField(false)
      }, 10000)
    }
  }, [highlightedField])

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
