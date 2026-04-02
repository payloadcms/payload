'use client'
import type { CollapsibleFieldClientComponent, DocumentPreferences } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react'

import { Collapsible as CollapsibleElement } from '../../elements/Collapsible/index.js'
import { ErrorPill } from '../../elements/ErrorPill/index.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { FieldDescription } from '../../fields/FieldDescription/index.js'
import { RenderFields } from '../../forms/RenderFields/index.js'
import { RowLabel } from '../../forms/RowLabel/index.js'
import { useField } from '../../forms/useField/index.js'
import { WatchChildErrors } from '../../forms/WatchChildErrors/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { mergeFieldStyles } from '../mergeFieldStyles.js'
import './index.scss'
import { fieldBaseClass } from '../shared/index.js'

const baseClass = 'collapsible-field'

const CollapsibleFieldComponent: CollapsibleFieldClientComponent = (props) => {
  const {
    field,
    field: { admin: { className, description, initCollapsed = false } = {}, fields, label } = {},
    indexPath,
    parentPath,
    parentSchemaPath,
    path,
    permissions,
    readOnly,
  } = props

  const { i18n } = useTranslation()
  const { getPreference, setPreference } = usePreferences()
  const { preferencesKey } = useDocumentInfo()
  const [collapsedOnMount, setCollapsedOnMount] = useState<boolean>()
  const fieldPreferencesKey = `collapsible-${path?.replace(/\./g, '__')}`
  const [errorCount, setErrorCount] = useState(0)
  const fieldHasErrors = errorCount > 0

  const { customComponents: { AfterInput, BeforeInput, Description, Label } = {}, disabled } =
    useField({
      path,
    })

  const onToggle = useCallback(
    async (newCollapsedState: boolean): Promise<void> => {
      const existingPreferences: DocumentPreferences = await getPreference(preferencesKey)

      if (preferencesKey) {
        void setPreference(preferencesKey, {
          ...existingPreferences,
          ...(path
            ? {
                fields: {
                  ...(existingPreferences?.fields || {}),
                  [path]: {
                    ...existingPreferences?.fields?.[path],
                    collapsed: newCollapsedState,
                  },
                },
              }
            : {
                fields: {
                  ...(existingPreferences?.fields || {}),
                  [fieldPreferencesKey]: {
                    ...existingPreferences?.fields?.[fieldPreferencesKey],
                    collapsed: newCollapsedState,
                  },
                },
              }),
        })
      }
    },
    [preferencesKey, fieldPreferencesKey, getPreference, setPreference, path],
  )

  useEffect(() => {
    const fetchInitialState = async () => {
      if (preferencesKey) {
        const preferences = await getPreference(preferencesKey)
        const specificPreference = path
          ? preferences?.fields?.[path]?.collapsed
          : preferences?.fields?.[fieldPreferencesKey]?.collapsed

        if (specificPreference !== undefined) {
          setCollapsedOnMount(Boolean(specificPreference))
        } else {
          setCollapsedOnMount(typeof initCollapsed === 'boolean' ? initCollapsed : false)
        }
      } else {
        setCollapsedOnMount(typeof initCollapsed === 'boolean' ? initCollapsed : false)
      }
    }

    void fetchInitialState()
  }, [getPreference, preferencesKey, fieldPreferencesKey, initCollapsed, path])

  const styles = useMemo(() => mergeFieldStyles(field), [field])

  if (typeof collapsedOnMount !== 'boolean') {
    return null
  }

  return (
    <Fragment>
      <WatchChildErrors
        fields={fields}
        // removes the 'collapsible' path segment, i.e. `_index-0`
        path={path.split('.').slice(0, -1)}
        setErrorCount={setErrorCount}
      />
      <div
        className={[
          fieldBaseClass,
          baseClass,
          className,
          fieldHasErrors ? `${baseClass}--has-error` : `${baseClass}--has-no-error`,
        ]
          .filter(Boolean)
          .join(' ')}
        id={`field-${fieldPreferencesKey}`}
        style={styles}
      >
        {BeforeInput}
        <CollapsibleElement
          className={`${baseClass}__collapsible`}
          collapsibleStyle={fieldHasErrors ? 'error' : 'default'}
          header={
            <div className={`${baseClass}__row-label-wrap`}>
              <RowLabel CustomComponent={Label} label={getTranslation(label, i18n)} path={path} />
              {fieldHasErrors && <ErrorPill count={errorCount} i18n={i18n} withMessage />}
            </div>
          }
          initCollapsed={collapsedOnMount}
          onToggle={onToggle}
        >
          <RenderFields
            fields={fields}
            margins="small"
            parentIndexPath={indexPath}
            parentPath={parentPath}
            parentSchemaPath={parentSchemaPath}
            permissions={permissions}
            readOnly={readOnly || disabled}
          />
        </CollapsibleElement>
        {AfterInput}
        <RenderCustomComponent
          CustomComponent={Description}
          Fallback={<FieldDescription description={description} path={path} />}
        />
      </div>
    </Fragment>
  )
}

export const CollapsibleField = withCondition(CollapsibleFieldComponent)
