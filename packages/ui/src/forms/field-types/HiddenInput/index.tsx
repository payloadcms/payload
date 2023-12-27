import React from 'react'

import type { Props } from './types'
import { HiddenInput } from './Input'

/**
 * This is mainly used to save a value on the form that is not visible to the user.
 * For example, this sets the `ìd` property of a block in the Blocks field.
 */
const HiddenField: React.FC<Props> = (props) => {
  const { name, disableModifyingForm = true, path: pathFromProps, value } = props

  const path = pathFromProps || name

  return <HiddenInput path={path} value={value} disableModifyingForm={disableModifyingForm} />
}

export default HiddenField
