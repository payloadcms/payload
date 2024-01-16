'use client'
import React from 'react'

import { useCollapsible } from '../../../elements/Collapsible/provider'
import { useFormSubmitted } from '../../Form/context'
import { useRow } from '../Row/provider'
import { useTabs } from '../Tabs/provider'
import { fieldBaseClass } from '../shared'
import { useGroup } from './provider'
import { GroupField } from 'payload/types'

import './index.scss'

const baseClass = 'group-field'

export const GroupWrapper: React.FC<
  Pick<GroupField['admin'], 'className' | 'hideGutter' | 'style' | 'width'> & {
    name: string
    children: React.ReactNode
    path?: string
  }
> = (props) => {
  const { name, className, hideGutter = false, style, width, path: pathFromProps, children } = props

  const isWithinCollapsible = useCollapsible()
  const isWithinGroup = useGroup()
  const isWithinRow = useRow()
  const isWithinTab = useTabs()
  const submitted = useFormSubmitted()
  const [errorCount] = React.useState(undefined)
  const groupHasErrors = submitted && errorCount > 0

  const path = pathFromProps || name
  const isTopLevel = !(isWithinCollapsible || isWithinGroup || isWithinRow)

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        isTopLevel && `${baseClass}--top-level`,
        isWithinCollapsible && `${baseClass}--within-collapsible`,
        isWithinGroup && `${baseClass}--within-group`,
        isWithinRow && `${baseClass}--within-row`,
        isWithinTab && `${baseClass}--within-tab`,
        !hideGutter && isWithinGroup && `${baseClass}--gutter`,
        groupHasErrors && `${baseClass}--has-error`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      id={`field-${path.replace(/\./g, '__')}`}
      style={{
        ...style,
        width,
      }}
    >
      {children}
    </div>
  )
}
