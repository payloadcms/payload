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
      path: pathFromProps,
    } = props

    const name = 'name' in props.field ? props.field.name : undefined

    const path = pathFromProps ?? name

    return (
      <WatchCondition indexPath={indexPath} name={name} path={path} type={type}>
        <Field {...props} />
      </WatchCondition>
    )
  }

  return CheckForCondition
}
