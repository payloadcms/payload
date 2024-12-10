'use client'
import type { FieldPaths } from 'payload'
import type { MarkOptional } from 'ts-essentials'

import React from 'react'

import { WatchCondition } from './WatchCondition.js'

export const withCondition = <P extends MarkOptional<FieldPaths, 'indexPath' | 'path'>>(
  Field: React.ComponentType<P>,
): React.FC<P> => {
  const CheckForCondition: React.FC<P> = (props) => {
    const { indexPath, path } = props

    return (
      <WatchCondition indexPath={indexPath} path={path}>
        <Field {...props} />
      </WatchCondition>
    )
  }

  return CheckForCondition
}
