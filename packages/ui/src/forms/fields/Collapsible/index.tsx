/* eslint-disable react/destructuring-assignment */
'use client'
import type { DocumentPreferences } from 'payload/types'

import React, { Fragment, useCallback, useEffect, useState } from 'react'

import type { Props } from './types.js'

import { Collapsible } from '../../../elements/Collapsible/index.js'
import { ErrorPill } from '../../../elements/ErrorPill/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { usePreferences } from '../../../providers/Preferences/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { useFieldProps } from '../../FieldPropsProvider/index.js'
import LabelComp from '../../Label/index.js'
import { RenderFields } from '../../RenderFields/index.js'
import { WatchChildErrors } from '../../WatchChildErrors/index.js'
import { withCondition } from '../../withCondition/index.js'
import { fieldBaseClass } from '../shared.js'
import './index.scss'

const baseClass = 'collapsible-field'

const CollapsibleField: React.FC<Props> = (props) => {
  const {
    Description,
    Label: LabelFromProps,
    className,
    fieldMap,
    label,
    path: pathFromProps,
    required,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const { path: pathFromContext, readOnly, schemaPath, siblingPermissions } = useFieldProps()
  const path = pathFromProps || pathFromContext

  const { i18n } = useTranslation()
  const initCollapsed = 'initCollapsed' in props ? props.initCollapsed : false
  const { getPreference, setPreference } = usePreferences()
  const { preferencesKey } = useDocumentInfo()
  const [collapsedOnMount, setCollapsedOnMount] = useState<boolean>()
  const fieldPreferencesKey = `collapsible-${path.replace(/\./g, '__')}`
  const [errorCount, setErrorCount] = useState(0)
  const fieldHasErrors = errorCount > 0

  const onToggle = useCallback(
    async (newCollapsedState: boolean) => {
      const existingPreferences: DocumentPreferences = await getPreference(preferencesKey)

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
    },
    [preferencesKey, fieldPreferencesKey, getPreference, setPreference, path],
  )

  useEffect(() => {
    const fetchInitialState = async () => {
      const preferences = await getPreference(preferencesKey)
      if (preferences) {
        const initCollapsedFromPref = path
          ? preferences?.fields?.[path]?.collapsed
          : preferences?.fields?.[fieldPreferencesKey]?.collapsed
        setCollapsedOnMount(Boolean(initCollapsedFromPref))
      } else {
        setCollapsedOnMount(typeof initCollapsed === 'boolean' ? initCollapsed : false)
      }
    }

    void fetchInitialState()
  }, [getPreference, preferencesKey, fieldPreferencesKey, initCollapsed, path])

  if (typeof collapsedOnMount !== 'boolean') return null

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
        <Collapsible
          className={`${baseClass}__collapsible`}
          collapsibleStyle={fieldHasErrors ? 'error' : 'default'}
          header={
            <div className={`${baseClass}__row-label-wrap`}>
              {Label}
              {fieldHasErrors && <ErrorPill count={errorCount} i18n={i18n} withMessage />}
            </div>
          }
          initCollapsed={collapsedOnMount}
          onToggle={onToggle}
        >
          <RenderFields
            fieldMap={fieldMap}
            forceRender
            margins="small"
            path={path}
            permissions={siblingPermissions}
            readOnly={readOnly}
            schemaPath={schemaPath}
          />
        </Collapsible>
        {Description}
      </div>
    </Fragment>
  )
}

export default withCondition(CollapsibleField)
