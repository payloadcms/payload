'use client'
import React from 'react'

import { useFieldPath } from '../FieldPathProvider'
import { WatchCondition } from './WatchCondition'

export const withCondition = <P extends Record<string, unknown>>(
  Field: React.ComponentType<P>,
): React.FC<P> => {
  const CheckForCondition: React.FC<P> = (props) => {
    const { name } = props
    const { path: pathFromContext } = useFieldPath()
    const path = pathFromContext || name

    return (
      <WatchCondition name={name as string} path={path as string}>
        <Field {...props} />
      </WatchCondition>
    )
  }

  return CheckForCondition
}
