import React, { useCallback, useEffect, useState } from 'react'

import type { DocumentPreferences } from '../../../../../preferences/types'
import type { Props } from './types'

import { Collapsible } from '../../../elements/Collapsible'
import { ErrorPill } from '../../../elements/ErrorPill'
import { useDocumentInfo } from '../../../utilities/DocumentInfo'
import { usePreferences } from '../../../utilities/Preferences'
import FieldDescription from '../../FieldDescription'
import { useFormSubmitted } from '../../Form/context'
import { createNestedFieldPath } from '../../Form/createNestedFieldPath'
import RenderFields from '../../RenderFields'
import { RowLabel } from '../../RowLabel'
import { WatchChildErrors } from '../../WatchChildErrors'
import withCondition from '../../withCondition'
import './index.scss'
import { fieldBaseClass } from '../shared'

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

  return (
    <div
      id={`field-${fieldPreferencesKey}${path ? `-${path.replace(/\./g, '__')}` : ''}`}
      className={[
        fieldBaseClass,
        baseClass,
        className,
        fieldHasErrors ? `${baseClass}--has-error` : `${baseClass}--has-no-error`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <WatchChildErrors fieldSchema={fields} path={path} setErrorCount={setErrorCount} />
      <Collapsible
        className={`${baseClass}__collapsible`}
        collapsibleStyle={errorCount > 0 ? 'error' : 'default'}
        header={
          <div className={`${baseClass}__row-label-wrap`}>
            <RowLabel label={label} path={path} />
            {errorCount > 0 && <ErrorPill count={errorCount} withMessage />}
          </div>
        }
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
          margins="small"
          permissions={permissions}
          readOnly={readOnly}
        />
      </Collapsible>
      <FieldDescription path={path} description={description} />
    </div>
  )
}

export default withCondition(CollapsibleField)
