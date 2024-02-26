'use client'
import React, { Fragment } from 'react'

import type { Props } from './types'

import { useCollapsible } from '../../../elements/Collapsible/provider'
import { ErrorPill } from '../../../elements/ErrorPill'
import { useTranslation } from '../../../providers/Translation'
import { FieldPathProvider, useFieldPath } from '../../FieldPathProvider'
import LabelComp from '../../Label'
import RenderFields from '../../RenderFields'
import { WatchChildErrors } from '../../WatchChildErrors'
import { withCondition } from '../../withCondition'
import { useRow } from '../Row/provider'
import { useTabs } from '../Tabs/provider'
import { fieldBaseClass } from '../shared'
import './index.scss'
import { GroupProvider, useGroup } from './provider'

const baseClass = 'group-field'

const Group: React.FC<Props> = (props) => {
  const {
    name,
    Description,
    Label: LabelFromProps,
    className,
    fieldMap,
    hideGutter,
    label,
    required,
    style,
    width,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const { path, schemaPath } = useFieldPath()
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
        <FieldPathProvider path={path} schemaPath={schemaPath}>
          <GroupProvider>
            <div className={`${baseClass}__wrap`}>
              <div className={`${baseClass}__header`}>
                {(Label || Description) && (
                  <header>
                    {Label}
                    {Description}
                  </header>
                )}
                {fieldHasErrors && <ErrorPill count={errorCount} i18n={i18n} withMessage />}
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
