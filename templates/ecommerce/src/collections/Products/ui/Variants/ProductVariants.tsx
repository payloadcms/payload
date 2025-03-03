'use client'

import type { GroupFieldClientComponent } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useMemo } from 'react'

import { useCollapsible } from '@payloadcms/ui'
import { ErrorPill } from '@payloadcms/ui'
import { RenderCustomComponent } from '@payloadcms/ui'
import { FieldDescription } from '@payloadcms/ui'
import { FieldLabel } from '@payloadcms/ui'
import { useFormSubmitted } from '@payloadcms/ui'
import { RenderFields } from '@payloadcms/ui'
import { useField } from '@payloadcms/ui'
import { withCondition } from '@payloadcms/ui'
import { useTranslation } from '@payloadcms/ui'
import { mergeFieldStyles } from '@payloadcms/ui/shared'
// import './index.scss'
// import { useTabs } from '@payloadcms/ui'
import { ProductVariantsProvider, useGroup } from './provider'

const baseClass = 'group-field'

const fieldBaseClass = 'product-variants'

export const ProductVariantsComponent: GroupFieldClientComponent = (props) => {
  const {
    field,
    field: { name, admin: { className, description, hideGutter } = {}, fields, label },
    path,
    permissions,
    readOnly,
    schemaPath: schemaPathFromProps,
  } = props
  const schemaPath = schemaPathFromProps ?? name

  const { i18n } = useTranslation()
  const { isWithinCollapsible } = useCollapsible()
  const isWithinGroup = useGroup()
  const isWithinRow = false // useRow()
  const isWithinTab = false //useTabs()
  const { customComponents: { AfterInput, BeforeInput, Description, Label } = {}, errorPaths } =
    useField({ path })
  const submitted = useFormSubmitted()
  const errorCount = errorPaths?.length ? errorPaths.length : 0
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
      <ProductVariantsProvider>
        <div className={`${baseClass}__wrap`}>
          {Boolean(Label || Description || label || fieldHasErrors) && (
            <div className={`${baseClass}__header`}>
              {Boolean(Label || Description || label) && (
                <header>
                  <RenderCustomComponent
                    CustomComponent={Label}
                    Fallback={
                      <h3 className={`${baseClass}__title`}>
                        {label && (
                          <FieldLabel
                            as="span"
                            label={getTranslation(label, i18n)}
                            localized={false}
                            path={path}
                            required={false}
                          />
                        )}
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
          <RenderFields
            fields={fields}
            margins="small"
            parentIndexPath=""
            parentPath={path}
            parentSchemaPath={schemaPath}
            permissions={permissions === true ? permissions : (permissions?.fields ?? {})}
            readOnly={readOnly}
          />
        </div>
      </ProductVariantsProvider>
      {AfterInput}
    </div>
  )
}

export const ProductVariants = withCondition(ProductVariantsComponent)
