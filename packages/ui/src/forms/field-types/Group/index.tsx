import React from 'react'

import type { Props } from './types'

import { ErrorPill } from '../../../elements/ErrorPill'
import FieldDescription from '../../FieldDescription'
import { createNestedFieldPath } from '../../Form/createNestedFieldPath'
import RenderFields from '../../RenderFields'
import { checkStateForErrors } from '../../WatchChildErrors/checkStateForErrors'
import './index.scss'
import { GroupProvider } from './provider'
import { GroupWrapper } from './Wrapper'

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
  } = props

  const path = pathFromProps || name

  const errorCount = checkStateForErrors({
    formState,
    path,
    fieldSchema: fields,
  })

  const groupHasErrors = errorCount > 0

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
                  value={null}
                />
              </header>
            )}
            {groupHasErrors && <ErrorPill count={errorCount} withMessage />}
          </div>
          <RenderFields
            fieldSchema={fields.map((subField) => ({
              ...subField,
              path: createNestedFieldPath(path, subField),
            }))}
            fieldTypes={fieldTypes}
            forceRender={forceRender}
            indexPath={indexPath}
            margins="small"
            permissions={permissions?.fields}
            readOnly={readOnly}
            user={user}
            formState={formState}
          />
        </div>
      </GroupProvider>
    </GroupWrapper>
  )
}

export default Group
