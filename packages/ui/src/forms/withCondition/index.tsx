'use client'
import React from 'react'

import { WatchCondition } from './WatchCondition'
import { useFieldPath } from '../FieldPathProvider'

export const withCondition = <P extends Record<string, unknown>>(
  Field: React.ComponentType<P>,
): React.FC<P> => {
  const CheckForCondition: React.FC<P> = (props) => {
    const { name } = props
    const pathFromContext = useFieldPath()
    const path = pathFromContext || name

    return (
      <WatchCondition name={name as string} path={path as string}>
        <Field {...props} />
      </WatchCondition>
    )
  }

  return CheckForCondition
}
