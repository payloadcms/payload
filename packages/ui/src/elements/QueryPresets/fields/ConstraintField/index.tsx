import type { SelectFieldServerComponent } from 'payload'

import { ConstraintFieldClient } from './index.client.js'

export const QueryPresetsConstraintField: SelectFieldServerComponent = (props) => {
  const {
    clientField,
    field,
    path,
    req,
    // @ts-expect-error - TODO: type this custom prop
    constraintOperation,
  } = props

  const allowedConstraints = req.payload.config.queryPresets?.allowedConstraints({
    allConstraints: field.options.map((option) =>
      typeof option === 'string' ? option : option.value,
    ),
    operation: constraintOperation,
    req,
  })

  return (
    <ConstraintFieldClient
      allowedConstraints={allowedConstraints}
      field={clientField}
      path={path}
    />
  )
}
