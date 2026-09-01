'use client'
import type { TextFieldClientComponent } from 'payload'

import React from 'react'

import { APIKeyInput } from '../../elements/APIKeyInput/index.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.css'

const baseClass = 'api-key-field'

/**
 * The raw secret is only ever present in the JSON response of the request that
 * generated it (create or regenerate) - it is never persisted, so a plain re-render or
 * refetch of the document cannot return it again. That response is captured in
 * `savedDocumentData` (via `updateSavedDocumentData`/the document form's own generic
 * post-save `setData` call), which is why this field sources its value from there rather
 * than from the form field's own value - the form field is never populated with it after
 * a create, only after an explicit regenerate.
 */
const APIKeyFieldComponent: TextFieldClientComponent = (props) => {
  const {
    field: { admin: { description } = {}, label },
    path: pathFromProps,
  } = props

  const {
    customComponents: { Description, Error, Label } = {},
    path,
    showError,
  } = useField<string>({ potentiallyStalePath: pathFromProps })

  const { savedDocumentData } = useDocumentInfo()

  const value = (savedDocumentData as Record<string, unknown> | undefined)?.apiKey as
    | string
    | undefined

  return (
    <div
      className={[fieldBaseClass, baseClass].filter(Boolean).join(' ')}
      id={`field-${path?.replace(/\./g, '__')}`}
    >
      <RenderCustomComponent
        CustomComponent={Label}
        Fallback={<FieldLabel label={label} path={path} />}
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <RenderCustomComponent
          CustomComponent={Error}
          Fallback={<FieldError path={path} showError={showError} />}
        />
        <APIKeyInput id={`field-${path?.replace(/\./g, '__')}`} value={value} />
        <RenderCustomComponent
          CustomComponent={Description}
          Fallback={<FieldDescription description={description} path={path} />}
        />
      </div>
    </div>
  )
}

export const APIKeyField = withCondition(APIKeyFieldComponent)
