import React from 'react'

import type { Props } from './types'

import DefaultError from '../../Error'
import FieldDescription from '../../FieldDescription'
import DefaultLabel from '../../Label'
import { JSONInputWrapper } from './Wrapper'
import { JSONInput } from './Input'

const JSONField: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { Error, Label } = {},
      description,
      editorOptions,
      readOnly,
      style,
      width,
    } = {},
    label,
    path: pathFromProps,
    required,
    i18n,
    value,
  } = props

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  const path = pathFromProps || name

  return (
    <JSONInputWrapper
      className={className}
      path={path}
      readOnly={readOnly}
      width={width}
      style={style}
    >
      <ErrorComp path={path} />
      <LabelComp htmlFor={`field-${path}`} label={label} required={required} i18n={i18n} />
      <JSONInput
        path={path}
        required={required}
        readOnly={readOnly}
        editorOptions={editorOptions}
      />
      <FieldDescription description={description} path={path} value={value} i18n={i18n} />
    </JSONInputWrapper>
  )
}

export default JSONField
