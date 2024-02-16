import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import { getTranslation } from '../../../../../utilities/getTranslation'
import { useCollapsible } from '../../../elements/Collapsible/provider'
import { ErrorPill } from '../../../elements/ErrorPill'
import FieldDescription from '../../FieldDescription'
import { useFormSubmitted } from '../../Form/context'
import { createNestedFieldPath } from '../../Form/createNestedFieldPath'
import RenderFields from '../../RenderFields'
import { WatchChildErrors } from '../../WatchChildErrors'
import withCondition from '../../withCondition'
import { useRow } from '../Row/provider'
import { useTabs } from '../Tabs/provider'
import { fieldBaseClass } from '../shared'
import './index.scss'
import { GroupProvider, useGroup } from './provider'

const baseClass = 'group-field'

const Group: React.FC<Props> = (props) => {
  const {
    name,
    admin: { className, description, hideGutter = false, readOnly, style, width },
    fieldTypes,
    fields,
    forceRender = false,
    indexPath,
    label,
    path: pathFromProps,
    permissions,
  } = props

  const { withinCollapsible } = useCollapsible()
  const isWithinGroup = useGroup()
  const isWithinRow = useRow()
  const isWithinTab = useTabs()
  const { i18n } = useTranslation()
  const submitted = useFormSubmitted()
  const [errorCount, setErrorCount] = React.useState(undefined)
  const groupHasErrors = submitted && errorCount > 0

  const path = pathFromProps || name
  const isTopLevel = !(withinCollapsible || isWithinGroup || isWithinRow)

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        isTopLevel && `${baseClass}--top-level`,
        withinCollapsible && `${baseClass}--within-collapsible`,
        isWithinGroup && `${baseClass}--within-group`,
        isWithinRow && `${baseClass}--within-row`,
        isWithinTab && `${baseClass}--within-tab`,
        !hideGutter && isWithinGroup && `${baseClass}--gutter`,
        groupHasErrors && `${baseClass}--has-error`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      id={`field-${path.replace(/\./g, '__')}`}
      style={{
        ...style,
        width,
      }}
    >
      <WatchChildErrors fieldSchema={fields} path={path} setErrorCount={setErrorCount} />
      <GroupProvider>
        <div className={`${baseClass}__wrap`}>
          <div className={`${baseClass}__header`}>
            {(label || description) && (
              <header>
                {label && <h3 className={`${baseClass}__title`}>{getTranslation(label, i18n)}</h3>}
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
          />
        </div>
      </GroupProvider>
    </div>
  )
}

export default withCondition(Group)
