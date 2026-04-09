'use client'

import type { NumberFieldClientComponent } from 'payload'

import { NumberField, useDocumentInfo, useField, useListQuery } from '@payloadcms/ui'
import React, { useEffect, useRef } from 'react'

export const LimitField: NumberFieldClientComponent = (props) => {
  const { id } = useDocumentInfo()
  const { setValue, value } = useField<number>()
  const { query } = useListQuery()

  const didInitRef = useRef(false)

  useEffect(() => {
    if (didInitRef.current) {
      return
    }
    if (id) {
      didInitRef.current = true
      return
    }
    if (typeof value === 'number') {
      didInitRef.current = true
      return
    }

    const queryLimit = query?.limit
    if (typeof queryLimit === 'number' && queryLimit > 0) {
      setValue(queryLimit)
    }

    didInitRef.current = true
  }, [id, query?.limit, value, setValue])

  return <NumberField field={props.field} path={props.path} />
}
