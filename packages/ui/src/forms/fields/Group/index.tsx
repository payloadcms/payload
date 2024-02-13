'use client'
import React, { Fragment } from 'react'

import type { Props } from './types'
import RenderFields from '../../RenderFields'
import { GroupProvider, useGroup } from './provider'
import { withCondition } from '../../withCondition'
import { useCollapsible } from '../../../elements/Collapsible/provider'
import { useRow } from '../Row/provider'
import { useTabs } from '../Tabs/provider'
import { fieldBaseClass } from '../shared'
import { FieldPathProvider, useFieldPath } from '../../FieldPathProvider'
import { WatchChildErrors } from '../../WatchChildErrors'
import { ErrorPill } from '../../../elements/ErrorPill'
import { useTranslation } from '../../../providers/Translation'
import LabelComp from '../../Label'

import './index.scss'

const baseClass = 'group-field'

const Group: React.FC<Props> = (props) => {
  const {
    className,
    style,
    width,
    fieldMap,
    Description,
    hideGutter,
    Label: LabelFromProps,
    label,
    required,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const path = useFieldPath()

  const { i18n } = useTranslation()
  const isWithinCollapsible = useCollapsible()
  const isWithinGroup = useGroup()
  const isWithinRow = useRow()
  const isWithinTab = useTabs()
  const [errorCount, setErrorCount] = React.useState(undefined)
  const fieldHasErrors = errorCount > 0

  const isTopLevel = !(isWithinCollapsible || isWithinGroup || isWithinRow)

  return (
    <Fragment>
      <WatchChildErrors fieldMap={fieldMap} path={path} setErrorCount={setErrorCount} />
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
          fieldHasErrors && `${baseClass}--has-error`,
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
        <FieldPathProvider path={path}>
          <GroupProvider>
            <div className={`${baseClass}__wrap`}>
              <div className={`${baseClass}__header`}>
                {(Label || Description) && (
                  <header>
                    {Label}
                    {Description}
                  </header>
                )}
                {fieldHasErrors && <ErrorPill count={errorCount} withMessage i18n={i18n} />}
              </div>
              <RenderFields fieldMap={fieldMap} />
            </div>
          </GroupProvider>
        </FieldPathProvider>
      </div>
    </Fragment>
  )
}

export default withCondition(Group)
