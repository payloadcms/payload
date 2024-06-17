'use client'
import React from 'react'

import { useFieldProps } from '../FieldPropsProvider/index.js'
import { WatchCondition } from './WatchCondition.js'

export const withCondition = <P extends Record<string, unknown>>(
  Field: React.ComponentType<P>,
): React.FC<P> => {
  const CheckForCondition: React.FC<P> = (props) => {
    const { name } = props
    const { type, indexPath, path: pathFromContext } = useFieldProps()
    const path = pathFromContext ?? name

    return (
      <WatchCondition indexPath={indexPath} name={name as string} path={path as string} type={type}>
        <Field {...props} />
      </WatchCondition>
    )
  }

  return CheckForCondition
}
