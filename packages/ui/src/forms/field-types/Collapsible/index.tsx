import React from 'react'

import type { Props } from './types'

import FieldDescription from '../../FieldDescription'
import { createNestedFieldPath } from '../../Form/createNestedFieldPath'
import RenderFields from '../../RenderFields'
import { CollapsibleFieldWrapper } from './Wrapper'
import { CollapsibleInput } from './Input'
import { getNestedFieldState } from '../../WatchChildErrors/getNestedFieldState'
import { RowLabel } from '../../RowLabel'

import './index.scss'

const baseClass = 'collapsible-field'

const CollapsibleField: React.FC<Props> = (props) => {
  const {
    admin: { className, description, initCollapsed: initCollapsedFromProps, readOnly },
    fieldTypes,
    fields,
    indexPath,
    label,
    path,
    permissions,
    i18n,
    config,
    payload,
    user,
    formState,
    docPreferences,
  } = props

  const { fieldState: nestedFieldState, pathSegments } = getNestedFieldState({
    formState,
    path,
    fieldSchema: fields,
  })

  const fieldPreferencesKey = `collapsible-${indexPath.replace(/\./g, '__')}`

  const initCollapsed = Boolean(
    docPreferences
      ? docPreferences?.fields?.[path || fieldPreferencesKey]?.collapsed
      : initCollapsedFromProps,
  )

  return (
    <CollapsibleFieldWrapper
      className={className}
      path={path}
      id={`field-${fieldPreferencesKey}${path ? `-${path.replace(/\./g, '__')}` : ''}`}
    >
      <CollapsibleInput
        initCollapsed={initCollapsed}
        baseClass={baseClass}
        RowLabel={<RowLabel data={formState} label={label} path={path} i18n={i18n} />}
        path={path}
        fieldPreferencesKey={fieldPreferencesKey}
        pathSegments={pathSegments}
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
          i18n={i18n}
          config={config}
          payload={payload}
          formState={nestedFieldState}
          user={user}
        />
      </CollapsibleInput>
      <FieldDescription description={description} path={path} i18n={i18n} />
    </CollapsibleFieldWrapper>
  )
}

export default CollapsibleField
