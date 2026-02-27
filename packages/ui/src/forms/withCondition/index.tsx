'use client'
import type { FieldPathProps } from 'payload'
import type { MarkOptional } from 'ts-essentials'

import React from 'react'

import { WatchCondition } from './WatchCondition.js'

export const withCondition = <P extends MarkOptional<FieldPathProps, 'indexPath' | 'path'>>(
  Field: React.ComponentType<P>,
): React.FC<P> => {
  const CheckForCondition: React.FC<P> = (props) => {
    const { path } = props

    return (
      <WatchCondition path={path}>
        <Field {...props} />
      </WatchCondition>
    )
  }

  return CheckForCondition
}
