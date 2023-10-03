import React from 'react'
import { useTranslation } from 'react-i18next'

import type { EditViewProps } from '../../types'

import { getTranslation } from '../../../../../utilities/getTranslation'
import { DocumentControls } from '../../../elements/DocumentControls'
import { Gutter } from '../../../elements/Gutter'
import { SetStepNav } from '../../../elements/StepNav/SetStepNav'
import ViewDescription from '../../../elements/ViewDescription'
import RenderFields from '../../../forms/RenderFields'
import { filterFields } from '../../../forms/RenderFields/filterFields'
import { fieldTypes } from '../../../forms/field-types'
import LeaveWithoutSaving from '../../../modals/LeaveWithoutSaving'
import Meta from '../../../utilities/Meta'
import './index.scss'

const baseClass = 'global-default-edit'

export const DefaultGlobalEdit: React.FC<EditViewProps> = (props) => {
  const { i18n } = useTranslation('general')

  if ('global' in props) {
    const { apiURL, data, global, permissions } = props

    const { admin: { description } = {}, fields, label } = global

    const hasSavePermission = permissions?.update?.permission

    const sidebarFields = filterFields({
      fieldSchema: fields,
      fieldTypes,
      filter: (field) => field?.admin?.position === 'sidebar',
      permissions: permissions.fields,
      readOnly: !hasSavePermission,
    })

    const hasSidebar = sidebarFields && sidebarFields.length > 0

    return (
      <React.Fragment>
        <SetStepNav global={global} slug={global?.slug} />
        <DocumentControls
          apiURL={apiURL}
          data={data}
          global={global}
          hasSavePermission={hasSavePermission}
          isEditing
          permissions={permissions}
        />
        <div
          className={[
            baseClass,
            hasSidebar ? `${baseClass}--has-sidebar` : `${baseClass}--no-sidebar`,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className={`${baseClass}__main`}>
            <Meta
              description={getTranslation(label, i18n)}
              keywords={`${getTranslation(label, i18n)}, Payload, CMS`}
              title={getTranslation(label, i18n)}
            />
            {!(global.versions?.drafts && global.versions?.drafts?.autosave) && (
              <LeaveWithoutSaving />
            )}
            <Gutter className={`${baseClass}__edit`}>
              <header className={`${baseClass}__header`}>
                {description && (
                  <div className={`${baseClass}__sub-header`}>
                    <ViewDescription description={description} />
                  </div>
                )}
              </header>
              <RenderFields
                fieldSchema={fields}
                fieldTypes={fieldTypes}
                filter={(field) =>
                  !field.admin.position ||
                  (field.admin.position && field.admin.position !== 'sidebar')
                }
                permissions={permissions.fields}
                readOnly={!hasSavePermission}
              />
            </Gutter>
          </div>
          {hasSidebar && (
            <div className={`${baseClass}__sidebar-wrap`}>
              <div className={`${baseClass}__sidebar`}>
                <div className={`${baseClass}__sidebar-sticky-wrap`}>
                  <div className={`${baseClass}__sidebar-fields`}>
                    <RenderFields
                      fieldSchema={fields}
                      fieldTypes={fieldTypes}
                      filter={(field) => field.admin.position === 'sidebar'}
                      permissions={permissions.fields}
                      readOnly={!hasSavePermission}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </React.Fragment>
    )
  }

  return null
}
