import React from 'react'

import type { Props } from './types'

import { RadioGroupWrapper } from './Wrapper'
import { withCondition } from '../../withCondition'
import FieldDescription from '../../FieldDescription'
import DefaultError from '../../Error'
import DefaultLabel from '../../Label'
import { RadioGroupInput } from './Input'

import './index.scss'

const baseClass = 'radio-group'

const RadioGroup: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { Error, Label } = {},
      description,
      layout = 'horizontal',
      readOnly,
      style,
      width,
    } = {},
    label,
    options,
    path: pathFromProps,
    required,
    i18n,
    value,
  } = props

  const path = pathFromProps || name

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  return (
    <RadioGroupWrapper
      width={width}
      className={className}
      style={style}
      layout={layout}
      path={path}
      readOnly={readOnly}
      baseClass={baseClass}
    >
      <div className={`${baseClass}__error-wrap`}>
        <ErrorComp path={path} />
      </div>
      <LabelComp htmlFor={`field-${path}`} label={label} required={required} i18n={i18n} />
      <RadioGroupInput path={path} options={options} readOnly={readOnly} baseClass={baseClass} />
      <FieldDescription description={description} path={path} value={value} i18n={i18n} />
    </RadioGroupWrapper>
  )
}

export default withCondition(RadioGroup)
