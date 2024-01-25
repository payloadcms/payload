'use client'
import React, { useCallback, useEffect, useState } from 'react'

import type { Props } from './types'

import { Collapsible } from '../../../elements/Collapsible'
import { useDocumentInfo } from '../../../providers/DocumentInfo'
import { usePreferences } from '../../../providers/Preferences'
import { useFormSubmitted } from '../../Form/context'
import RenderFields from '../../RenderFields'
import { withCondition } from '../../withCondition'
import { fieldBaseClass } from '../shared'
import { DocumentPreferences } from 'payload/types'
import { useFieldPath } from '../../FieldPathProvider'

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
    Label,
  } = props

  const pathFromContext = useFieldPath()
  const path = pathFromProps || pathFromContext

  const initCollapsed = 'initCollapsed' in props ? props.initCollapsed : false
  const { getPreference, setPreference } = usePreferences()
  const { preferencesKey } = useDocumentInfo()
  const [collapsedOnMount, setCollapsedOnMount] = useState<boolean>()
  const fieldPreferencesKey = `collapsible-${path.replace(/\./g, '__')}`
  const [errorCount, setErrorCount] = useState(0)
  const submitted = useFormSubmitted()

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

  const fieldHasErrors = submitted && errorCount > 0

  return (
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
      {/* <WatchChildErrors fieldSchema={fields} path={path} setErrorCount={setErrorCount} /> */}
      <Collapsible
        className={`${baseClass}__collapsible`}
        collapsibleStyle={errorCount > 0 ? 'error' : 'default'}
        header={
          <div className={`${baseClass}__row-label-wrap`}>
            {Label}
            {errorCount > 0 && Error}
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
  )
}

export default withCondition(CollapsibleField)
