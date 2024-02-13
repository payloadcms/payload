'use client'
import React, { Fragment, useCallback, useEffect, useState } from 'react'

import type { Props } from './types'

import { Collapsible } from '../../../elements/Collapsible'
import { useDocumentInfo } from '../../../providers/DocumentInfo'
import { usePreferences } from '../../../providers/Preferences'
import RenderFields from '../../RenderFields'
import { withCondition } from '../../withCondition'
import { fieldBaseClass } from '../shared'
import { DocumentPreferences } from 'payload/types'
import { useFieldPath } from '../../FieldPathProvider'
import { WatchChildErrors } from '../../WatchChildErrors'
import { ErrorPill } from '../../../elements/ErrorPill'
import { useTranslation } from '../../../providers/Translation'
import LabelComp from '../../Label'

import './index.scss'

const baseClass = 'collapsible-field'

const CollapsibleField: React.FC<Props> = (props) => {
  const {
    className,
    readOnly,
    path: pathFromProps,
    permissions,
    Description,
    Error,
    fieldMap,
    Label: LabelFromProps,
    label,
    required,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const pathFromContext = useFieldPath()
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

      setPreference(preferencesKey, {
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

    fetchInitialState()
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
              {fieldHasErrors && <ErrorPill count={errorCount} withMessage i18n={i18n} />}
            </div>
          }
          initCollapsed={collapsedOnMount}
          onToggle={onToggle}
        >
          <RenderFields
            fieldMap={fieldMap}
            forceRender
            indexPath={path}
            margins="small"
            permissions={permissions}
            readOnly={readOnly}
          />
        </Collapsible>
        {Description}
      </div>
    </Fragment>
  )
}

export default withCondition(CollapsibleField)
