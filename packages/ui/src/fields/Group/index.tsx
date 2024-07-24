'use client'

import { getTranslation } from '@payloadcms/translations'
import React, { Fragment } from 'react'

import type { FieldMap } from '../../providers/ComponentMap/buildComponentMap/types.js'
import type { FormFieldBase } from '../shared/index.js'

import { useCollapsible } from '../../elements/Collapsible/provider.js'
import { ErrorPill } from '../../elements/ErrorPill/index.js'
import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import {
  useFormInitializing,
  useFormProcessing,
  useFormSubmitted,
} from '../../forms/Form/context.js'
import { RenderFields } from '../../forms/RenderFields/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { useRow } from '../Row/provider.js'
import { useTabs } from '../Tabs/provider.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'
import { GroupProvider, useGroup } from './provider.js'

const baseClass = 'group-field'

export type GroupFieldProps = {
  fieldMap: FieldMap
  forceRender?: boolean
  hideGutter?: boolean
  name?: string
  width?: string
} & FormFieldBase

export const _GroupField: React.FC<GroupFieldProps> = (props) => {
  const {
    CustomDescription,
    CustomLabel,
    className,
    descriptionProps,
    fieldMap,
    hideGutter,
    label,
    readOnly: readOnlyFromProps,
    style,
    width,
  } = props

  const { path, permissions, readOnly: readOnlyFromContext, schemaPath } = useFieldProps()
  const { i18n } = useTranslation()
  const { isWithinCollapsible } = useCollapsible()
  const isWithinGroup = useGroup()
  const isWithinRow = useRow()
  const isWithinTab = useTabs()
  const { errorPaths } = useField({ path })
  const formInitializing = useFormInitializing()
  const formProcessing = useFormProcessing()
  const submitted = useFormSubmitted()
  const errorCount = errorPaths.length
  const fieldHasErrors = submitted && errorCount > 0
  const disabled = readOnlyFromProps || readOnlyFromContext || formProcessing || formInitializing

  const isTopLevel = !(isWithinCollapsible || isWithinGroup || isWithinRow)

  return (
    <Fragment>
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
              {(CustomLabel || CustomDescription || label) && (
                <header>
                  {CustomLabel !== undefined ? (
                    CustomLabel
                  ) : label ? (
                    <h3 className={`${baseClass}__title`}>{getTranslation(label, i18n)}</h3>
                  ) : null}
                  {CustomDescription !== undefined ? (
                    CustomDescription
                  ) : (
                    <FieldDescription {...(descriptionProps || {})} />
                  )}
                </header>
              )}
              {fieldHasErrors && <ErrorPill count={errorCount} i18n={i18n} withMessage />}
            </div>
            <RenderFields
              fieldMap={fieldMap}
              margins="small"
              path={path}
              permissions={permissions?.fields}
              readOnly={disabled}
              schemaPath={schemaPath}
            />
          </div>
        </GroupProvider>
      </div>
    </Fragment>
  )
}

export { GroupProvider, useGroup }

export const GroupField = withCondition(_GroupField)
