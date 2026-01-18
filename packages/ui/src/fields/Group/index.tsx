'use client'

import type { GroupFieldClientComponent } from '@ruya.sa/payload'

import { getTranslation } from '@ruya.sa/translations'
import { groupHasName } from '@ruya.sa/payload/shared'
import React, { useMemo } from 'react'

import { useCollapsible } from '../../elements/Collapsible/provider.js'
import { ErrorPill } from '../../elements/ErrorPill/index.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { FieldDescription } from '../../fields/FieldDescription/index.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { useFormSubmitted } from '../../forms/Form/context.js'
import { RenderFields } from '../../forms/RenderFields/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { mergeFieldStyles } from '../mergeFieldStyles.js'
import './index.scss'
import { useRow } from '../Row/provider.js'
import { fieldBaseClass } from '../shared/index.js'
import { useTabs } from '../Tabs/provider.js'
import { GroupProvider, useGroup } from './provider.js'

const baseClass = 'group-field'

export const GroupFieldComponent: GroupFieldClientComponent = (props) => {
  const {
    field,
    field: { admin: { className, description, hideGutter } = {}, fields, label },
    indexPath,
    parentPath,
    parentSchemaPath,
    path,
    permissions,
    readOnly,
    schemaPath: schemaPathFromProps,
  } = props

  const schemaPath =
    schemaPathFromProps ?? (field.type === 'group' && groupHasName(field) ? field.name : path)

  const { i18n } = useTranslation()
  const { isWithinCollapsible } = useCollapsible()
  const isWithinGroup = useGroup()
  const isWithinRow = useRow()
  const isWithinTab = useTabs()

  const { customComponents: { AfterInput, BeforeInput, Description, Label } = {}, errorPaths } =
    useField({ path })

  const submitted = useFormSubmitted()
  const errorCount = errorPaths.length
  const fieldHasErrors = submitted && errorCount > 0

  const isTopLevel = !(isWithinCollapsible || isWithinGroup || isWithinRow)

  const styles = useMemo(() => mergeFieldStyles(field), [field])

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
        fieldHasErrors && `${baseClass}--has-error`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      id={`field-${path?.replace(/\./g, '__')}`}
      style={styles}
    >
      <GroupProvider>
        <div className={`${baseClass}__wrap`}>
          {Boolean(Label || Description || label || fieldHasErrors) && (
            <div className={`${baseClass}__header`}>
              {Boolean(Label || Description || label) && (
                <header>
                  <RenderCustomComponent
                    CustomComponent={Label}
                    Fallback={
                      <h3 className={`${baseClass}__title`}>
                        <FieldLabel
                          as="span"
                          label={getTranslation(label, i18n)}
                          localized={false}
                          path={path}
                          required={false}
                        />
                      </h3>
                    }
                  />
                  <RenderCustomComponent
                    CustomComponent={Description}
                    Fallback={<FieldDescription description={description} path={path} />}
                  />
                </header>
              )}
              {fieldHasErrors && <ErrorPill count={errorCount} i18n={i18n} withMessage />}
            </div>
          )}
          {BeforeInput}
          {/* Render an unnamed group differently */}
          {groupHasName(field) ? (
            <RenderFields
              fields={fields}
              margins="small"
              parentIndexPath=""
              parentPath={path}
              parentSchemaPath={schemaPath}
              permissions={permissions === true ? permissions : permissions?.fields}
              readOnly={readOnly}
            />
          ) : (
            <RenderFields
              fields={fields}
              margins="small"
              parentIndexPath={indexPath}
              parentPath={parentPath}
              parentSchemaPath={parentSchemaPath}
              permissions={permissions}
              readOnly={readOnly}
            />
          )}
        </div>
      </GroupProvider>
      {AfterInput}
    </div>
  )
}

export { GroupProvider, useGroup }

export const GroupField = withCondition(GroupFieldComponent)
