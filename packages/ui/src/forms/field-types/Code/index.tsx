import React from 'react'

import type { Props } from './types'

import DefaultError from '../../Error'
import FieldDescription from '../../FieldDescription'
import DefaultLabel from '../../Label'
import { CodeInputWrapper } from './Wrapper'
import { CodeInput } from './Input'

const Code: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { Error, Label } = {},
      description,
      editorOptions,
      language,
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
    <CodeInputWrapper
      className={className}
      path={path}
      readOnly={readOnly}
      style={style}
      width={width}
    >
      <ErrorComp path={path} />
      <LabelComp htmlFor={`field-${path}`} label={label} required={required} i18n={i18n} />
      <CodeInput
        path={path}
        required={required}
        readOnly={readOnly}
        name={name}
        language={language}
        editorOptions={editorOptions}
      />
      <FieldDescription description={description} path={path} value={value} i18n={i18n} />
    </CodeInputWrapper>
  )
}

export default Code
