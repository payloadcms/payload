'use client'
import type { AdminClient, CollapsibleFieldClientComponent, DocumentPreferences } from 'payload'

import React, { Fragment, useCallback, useEffect, useState } from 'react'

import { Collapsible as CollapsibleElement } from '../../elements/Collapsible/index.js'
import { ErrorPill } from '../../elements/ErrorPill/index.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { FieldDescription } from '../../fields/FieldDescription/index.js'
import { RenderFields } from '../../forms/RenderFields/index.js'
import { RowLabel } from '../../forms/RowLabel/index.js'
import { WatchChildErrors } from '../../forms/WatchChildErrors/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

const baseClass = 'collapsible-field'

const CollapsibleFieldComponent: CollapsibleFieldClientComponent = (props) => {
  const {
    field,
    field: { admin: { className, description, initCollapsed = false } = {}, fields, label } = {},
    fieldState: { customComponents: { Description, Label } = {} } = {},
    path,
    permissions,
    readOnly,
    schemaPath,
  } = props

  const { i18n } = useTranslation()
  const { getPreference, setPreference } = usePreferences()
  const { preferencesKey } = useDocumentInfo()
  const [collapsedOnMount, setCollapsedOnMount] = useState<boolean>()
  const fieldPreferencesKey = `collapsible-${schemaPath?.replace(/\./g, '__')}`
  const [errorCount, setErrorCount] = useState(0)
  const fieldHasErrors = errorCount > 0

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

  if (typeof collapsedOnMount !== 'boolean') {
    return null
  }

  const style: AdminClient['style'] = {
    ...field.admin?.style,
    '--field-width': field.admin.width,
  }

  return (
    <Fragment>
      <WatchChildErrors fields={fields} path={path.split('.')} setErrorCount={setErrorCount} />
      <div
        className={[
          fieldBaseClass,
          baseClass,
          className,
          fieldHasErrors ? `${baseClass}--has-error` : `${baseClass}--has-no-error`,
        ]
          .filter(Boolean)
          .join(' ')}
        id={`field-${fieldPreferencesKey}${path ? `-${path?.replace(/\./g, '__')}` : ''}`}
        style={style}
      >
        <CollapsibleElement
          className={`${baseClass}__collapsible`}
          collapsibleStyle={fieldHasErrors ? 'error' : 'default'}
          header={
            <div className={`${baseClass}__row-label-wrap`}>
              <RenderCustomComponent
                CustomComponent={Label}
                Fallback={<RowLabel rowLabel={label} />}
              />
              {fieldHasErrors && <ErrorPill count={errorCount} i18n={i18n} withMessage />}
            </div>
          }
          initCollapsed={collapsedOnMount}
          onToggle={onToggle}
        >
          <RenderFields
            fields={fields}
            margins="small"
            parentPath={path.split('.')}
            permissions={permissions}
            readOnly={readOnly}
          />
        </CollapsibleElement>
        <RenderCustomComponent
          CustomComponent={Description}
          Fallback={<FieldDescription description={description} path={path} />}
        />
      </div>
    </Fragment>
  )
}

export const CollapsibleField = withCondition(CollapsibleFieldComponent)
