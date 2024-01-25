'use client'
import React from 'react'

import type { Props } from './types'
import RenderFields from '../../RenderFields'
import { GroupProvider, useGroup } from './provider'
import { withCondition } from '../../withCondition'
import { getTranslation } from '@payloadcms/translations'
import { useTranslation } from '../../../providers/Translation'
import { useCollapsible } from '../../../elements/Collapsible/provider'
import { useRow } from '../Row/provider'
import { useTabs } from '../Tabs/provider'
import { useFormSubmitted } from '../../../forms/Form/context'
import { fieldBaseClass } from '../shared'

import './index.scss'

const baseClass = 'group-field'

const Group: React.FC<Props> = (props) => {
  const { className, style, width, fieldMap, Description, hideGutter, path, label } = props

  const { i18n } = useTranslation()

  const hasSubmitted = useFormSubmitted()
  const isWithinCollapsible = useCollapsible()
  const isWithinGroup = useGroup()
  const isWithinRow = useRow()
  const isWithinTab = useTabs()
  const [errorCount] = React.useState(undefined)
  const groupHasErrors = hasSubmitted && errorCount > 0

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
      id={`field-${path?.replace(/\./g, '__')}`}
      style={{
        ...style,
        width,
      }}
    >
      <GroupProvider>
        <div className={`${baseClass}__wrap`}>
          <div className={`${baseClass}__header`}>
            {(label || Description) && (
              <header>
                {/* {label && <h3 className={`${baseClass}__title`}>{getTranslation(label, i18n)}</h3>} */}
                {Description}
              </header>
            )}
            {/* <GroupFieldErrors pathSegments={pathSegments} /> */}
          </div>
          <RenderFields fieldMap={fieldMap} />
        </div>
      </GroupProvider>
    </div>
  )
}

export default withCondition(Group)
