'use client'
import type { AdminClient, CollapsibleFieldClientComponent, DocumentPreferences } from 'payload'

import React, { Fragment, useCallback, useEffect, useState } from 'react'

import { Collapsible as CollapsibleElement } from '../../elements/Collapsible/index.js'
import { ErrorPill } from '../../elements/ErrorPill/index.js'
import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { RenderFields } from '../../forms/RenderFields/index.js'
import { WatchChildErrors } from '../../forms/WatchChildErrors/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

const baseClass = 'collapsible-field'

import { useFormInitializing, useFormProcessing } from '../../forms/Form/context.js'

const CollapsibleFieldComponent: CollapsibleFieldClientComponent = (props) => {
  const {
    Description,
    field,
    field: {
      _path: pathFromProps,
      admin: { className, initCollapsed = false, readOnly: readOnlyFromAdmin } = {},
      fields,
    },
    readOnly: readOnlyFromTopLevelProps,
  } = props

  const readOnlyFromProps = readOnlyFromTopLevelProps || readOnlyFromAdmin

  const {
    indexPath,
    path: pathFromContext,
    readOnly: readOnlyFromContext,
    schemaPath,
    siblingPermissions,
  } = useFieldProps()

  const formInitializing = useFormInitializing()
  const formProcessing = useFormProcessing()

  const path = pathFromContext ?? pathFromProps

  const { i18n } = useTranslation()
  const { getPreference, setPreference } = usePreferences()
  const { preferencesKey } = useDocumentInfo()
  const [collapsedOnMount, setCollapsedOnMount] = useState<boolean>()
  const fieldPreferencesKey = `collapsible-${indexPath.replace(/\./g, '__')}`
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

  const disabled = readOnlyFromProps || readOnlyFromContext || formProcessing || formInitializing

  const style: AdminClient['style'] = {
    ...field.admin?.style,
    '--field-width': field.admin.width,
  }

  return (
    <Fragment>
      <WatchChildErrors fields={fields} path={path} setErrorCount={setErrorCount} />
      <div
        className={[
          fieldBaseClass,
          baseClass,
          className,
          fieldHasErrors ? `${baseClass}--has-error` : `${baseClass}--has-no-error`,
        ]
          .filter(Boolean)
          .join(' ')}
        id={`field-${fieldPreferencesKey}${path ? `-${path.replace(/\./g, '__')}` : ''}`}
        style={style}
      >
        <CollapsibleElement
          className={`${baseClass}__collapsible`}
          collapsibleStyle={fieldHasErrors ? 'error' : 'default'}
          header={
            <div className={`${baseClass}__row-label-wrap`}>
              {/* <RowLabel
                i18n={i18n}
                path={path}
                RowLabel={
                  field?.admin?.components && 'RowLabel' in field.admin.components
                    ? field.admin.components.RowLabel
                    : undefined
                }
                rowLabel={label}
              /> */}
              {fieldHasErrors && <ErrorPill count={errorCount} i18n={i18n} withMessage />}
            </div>
          }
          initCollapsed={collapsedOnMount}
          onToggle={onToggle}
        >
          <RenderFields
            fields={fields}
            forceRender
            indexPath={indexPath}
            margins="small"
            path={path}
            permissions={siblingPermissions}
            readOnly={disabled}
            schemaPath={schemaPath}
          />
        </CollapsibleElement>
        {Description}
      </div>
    </Fragment>
  )
}

export const CollapsibleField = withCondition(CollapsibleFieldComponent)
