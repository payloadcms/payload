'use client'
import type { ClientFieldProps, FieldPaths } from 'payload'
import type { MarkOptional } from 'ts-essentials'

import React from 'react'

import { WatchCondition } from './WatchCondition.js'

export const withCondition = <
  P extends MarkOptional<FieldPaths & Pick<ClientFieldProps, 'field'>, 'indexPath' | 'path'>,
>(
  Field: React.ComponentType<P>,
): React.FC<P> => {
  const CheckForCondition: React.FC<P> = (props) => {
    const {
      field: { type },
      indexPath,
      path,
    } = props

    return (
      <WatchCondition indexPath={indexPath} path={path} type={type}>
        <Field {...props} />
      </WatchCondition>
    )
  }

  return CheckForCondition
}
