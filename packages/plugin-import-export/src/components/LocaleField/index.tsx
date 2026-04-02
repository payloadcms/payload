'use client'

import type { SelectFieldClientComponent } from 'payload'

import { SelectField, useDocumentInfo, useField, useLocale } from '@payloadcms/ui'
import React, { useEffect, useRef } from 'react'

export const LocaleField: SelectFieldClientComponent = (props) => {
  const { id } = useDocumentInfo()
  const { setValue, value } = useField<string>()
  const locale = useLocale()

  const didInitRef = useRef(false)

  useEffect(() => {
    if (didInitRef.current) {
      return
    }
    if (id) {
      didInitRef.current = true
      return
    }
    if (typeof value === 'string' && value !== 'all') {
      didInitRef.current = true
      return
    }

    if (locale?.code) {
      setValue(locale.code)
    }

    didInitRef.current = true
  }, [id, locale?.code, value, setValue])

  return <SelectField field={props.field} path={props.path} />
}
