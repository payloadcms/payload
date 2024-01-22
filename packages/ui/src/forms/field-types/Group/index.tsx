import React from 'react'

import type { Props } from './types'
import FieldDescription from '../../FieldDescription'
import { createNestedFieldPath } from '../../Form/createNestedFieldPath'
import RenderFields from '../../RenderFields'
import { GroupProvider } from './provider'
import { GroupWrapper } from './Wrapper'
import { withCondition } from '../../withCondition'
import { getNestedFieldState } from '../../WatchChildErrors/getNestedFieldState'
import { GroupFieldErrors } from './Errors'
import { buildPathSegments } from '../../WatchChildErrors/buildPathSegments'

import './index.scss'

const baseClass = 'group-field'

const Group: React.FC<Props> = (props) => {
  const {
    name,
    admin: { description, className, hideGutter = false, readOnly, style, width },
    fieldTypes,
    fields,
    forceRender = false,
    indexPath,
    label,
    path: pathFromProps,
    permissions,
    formState,
    user,
    i18n,
    payload,
    config,
    value,
  } = props

  const path = pathFromProps || name

  const { fieldState: nestedFieldState } = getNestedFieldState({
    formState,
    path,
    fieldSchema: fields,
  })

  const fieldSchema = fields.map((subField) => ({
    ...subField,
    path: createNestedFieldPath(path, subField),
  }))

  const pathSegments = buildPathSegments(path, fieldSchema)

  return (
    <GroupWrapper
      name={name}
      path={path}
      className={className}
      hideGutter={hideGutter}
      style={style}
      width={width}
    >
      <GroupProvider>
        <div className={`${baseClass}__wrap`}>
          <div className={`${baseClass}__header`}>
            {(label || description) && (
              <header>
                {label && (
                  <h3 className={`${baseClass}__title`}>
                    {typeof label === 'string' ? label : 'Group Title'}
                    {/* {getTranslation(label, i18n)} */}
                  </h3>
                )}
                <FieldDescription
                  className={`field-description-${path.replace(/\./g, '__')}`}
                  description={description}
                  path={path}
                  value={value}
                  i18n={i18n}
                />
              </header>
            )}
            <GroupFieldErrors pathSegments={pathSegments} />
          </div>
          <RenderFields
            fieldSchema={fieldSchema}
            fieldTypes={fieldTypes}
            forceRender={forceRender}
            indexPath={indexPath}
            margins="small"
            permissions={permissions?.fields}
            readOnly={readOnly}
            user={user}
            formState={nestedFieldState}
            i18n={i18n}
            payload={payload}
            config={config}
          />
        </div>
      </GroupProvider>
    </GroupWrapper>
  )
}

export default withCondition(Group)
