'use client'
import type { DocumentPreferences, FieldPermissions } from 'payload'

import React, { Fragment, useCallback, useEffect, useState } from 'react'

import { Collapsible as CollapsibleElement } from '../../elements/Collapsible/index.js'
import { ErrorPill } from '../../elements/ErrorPill/index.js'
import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
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

import type { FieldMap } from '../../providers/ComponentMap/buildComponentMap/types.js'
import type { FormFieldBase } from '../shared/index.js'

import { useFormInitializing, useFormProcessing } from '../../forms/Form/context.js'
import { FieldDescription } from '../FieldDescription/index.js'

export type CollapsibleFieldProps = {
  fieldMap: FieldMap
  initCollapsed?: boolean
  width?: string
} & FormFieldBase

const _CollapsibleField: React.FC<CollapsibleFieldProps> = (props) => {
  const {
    CustomDescription,
    CustomLabel,
    className,
    descriptionProps,
    fieldMap,
    initCollapsed = false,
    label,
    path: pathFromProps,
    readOnly: readOnlyFromProps,
  } = props

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
    async (newCollapsedState: boolean) => {
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

  if (typeof collapsedOnMount !== 'boolean') return null

  const disabled = readOnlyFromProps || readOnlyFromContext || formProcessing || formInitializing

  return (
    <Fragment>
      <WatchChildErrors fieldMap={fieldMap} path={path} setErrorCount={setErrorCount} />
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
      >
        <CollapsibleElement
          className={`${baseClass}__collapsible`}
          collapsibleStyle={fieldHasErrors ? 'error' : 'default'}
          header={
            <div className={`${baseClass}__row-label-wrap`}>
              <RowLabel RowLabelComponent={CustomLabel} i18n={i18n} path={path} rowLabel={label} />
              {fieldHasErrors && <ErrorPill count={errorCount} i18n={i18n} withMessage />}
            </div>
          }
          initCollapsed={collapsedOnMount}
          onToggle={onToggle}
        >
          <RenderFields
            fieldMap={fieldMap}
            forceRender
            indexPath={indexPath}
            margins="small"
            path={path}
            permissions={siblingPermissions}
            readOnly={disabled}
            schemaPath={schemaPath}
          />
        </CollapsibleElement>
        <FieldDescription CustomDescription={CustomDescription} {...(descriptionProps || {})} />
      </div>
    </Fragment>
  )
}

export const CollapsibleField = withCondition(_CollapsibleField)
