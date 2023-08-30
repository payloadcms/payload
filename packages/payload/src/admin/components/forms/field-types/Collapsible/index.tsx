import React, { useCallback, useEffect, useState } from 'react'

import type { DocumentPreferences } from '../../../../../preferences/types.js'
import type { Props } from './types.js'

import { Collapsible } from '../../../elements/Collapsible/index.js'
import { ErrorPill } from '../../../elements/ErrorPill/index.js'
import { useDocumentInfo } from '../../../utilities/DocumentInfo/index.js'
import { usePreferences } from '../../../utilities/Preferences/index.js'
import FieldDescription from '../../FieldDescription/index.js'
import { useFormSubmitted } from '../../Form/context.js'
import { createNestedFieldPath } from '../../Form/createNestedFieldPath.js'
import RenderFields from '../../RenderFields/index.js'
import { RowLabel } from '../../RowLabel/index.js'
import { WatchChildErrors } from '../../WatchChildErrors/index.js'
import withCondition from '../../withCondition/index.js'
import './index.scss'

const baseClass = 'collapsible-field'

const CollapsibleField: React.FC<Props> = (props) => {
  const {
    admin: { className, description, initCollapsed, readOnly },
    fieldTypes,
    fields,
    indexPath,
    label,
    path,
    permissions,
  } = props

  const { getPreference, setPreference } = usePreferences()
  const { preferencesKey } = useDocumentInfo()
  const [collapsedOnMount, setCollapsedOnMount] = useState<boolean>()
  const fieldPreferencesKey = `collapsible-${indexPath.replace(/\./g, '__')}`
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

  const classes = [
    'field-type',
    baseClass,
    className,
    fieldHasErrors ? `${baseClass}--has-error` : `${baseClass}--has-no-error`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div id={`field-${fieldPreferencesKey}${path ? `-${path.replace(/\./g, '__')}` : ''}`}>
      <WatchChildErrors fieldSchema={fields} path={path} setErrorCount={setErrorCount} />
      <Collapsible
        header={
          <div className={`${baseClass}__row-label-wrap`}>
            <RowLabel label={label} path={path} />
            {errorCount > 0 && <ErrorPill count={errorCount} withMessage />}
          </div>
        }
        className={classes}
        collapsibleStyle={errorCount > 0 ? 'error' : 'default'}
        initCollapsed={collapsedOnMount}
        onToggle={onToggle}
      >
        <RenderFields
          fieldSchema={fields.map((field) => ({
            ...field,
            path: createNestedFieldPath(path, field),
          }))}
          fieldTypes={fieldTypes}
          forceRender
          indexPath={indexPath}
          permissions={permissions}
          readOnly={readOnly}
        />
      </Collapsible>
      <FieldDescription description={description} />
    </div>
  )
}

export default withCondition(CollapsibleField)
