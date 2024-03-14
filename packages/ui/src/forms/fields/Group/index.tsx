'use client'
import React, { Fragment } from 'react'

import type { Props } from './types.js'

import { useCollapsible } from '../../../elements/Collapsible/provider.js'
import { ErrorPill } from '../../../elements/ErrorPill/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { useFieldProps } from '../../FieldPropsProvider/index.js'
import LabelComp from '../../Label/index.js'
import { RenderFields } from '../../RenderFields/index.js'
import { WatchChildErrors } from '../../WatchChildErrors/index.js'
import { withCondition } from '../../withCondition/index.js'
import { useRow } from '../Row/provider.js'
import { useTabs } from '../Tabs/provider.js'
import { fieldBaseClass } from '../shared.js'
import './index.scss'
import { GroupProvider, useGroup } from './provider.js'

const baseClass = 'group-field'

const Group: React.FC<Props> = (props) => {
  const {
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

  const { path, permissions, readOnly, schemaPath } = useFieldProps()
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
            <RenderFields
              fieldMap={fieldMap}
              path={path}
              permissions={permissions?.fields}
              readOnly={readOnly}
              schemaPath={schemaPath}
            />
          </div>
        </GroupProvider>
      </div>
    </Fragment>
  )
}

export default withCondition(Group)
