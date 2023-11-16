import React from 'react'
import { useTranslation } from 'react-i18next'

import type { FieldTypes } from '../../../forms/field-types'
import type { GlobalEditViewProps } from '../../types'

import { getTranslation } from '../../../../../utilities/getTranslation'
import { DocumentControls } from '../../../elements/DocumentControls'
import { DocumentFields } from '../../../elements/DocumentFields'
import { LeaveWithoutSaving } from '../../../modals/LeaveWithoutSaving'
import Meta from '../../../utilities/Meta'
import { SetStepNav } from '../../collections/Edit/SetStepNav'

export const DefaultGlobalEdit: React.FC<
  GlobalEditViewProps & {
    fieldTypes: FieldTypes
  }
> = (props) => {
  const { apiURL, data, fieldTypes, global, permissions } = props
  const { i18n } = useTranslation()

  const { admin: { description } = {}, fields, label } = global

  const hasSavePermission = permissions?.update?.permission

  return (
    <React.Fragment>
      <Meta
        description={getTranslation(label, i18n)}
        keywords={`${getTranslation(label, i18n)}, Payload, CMS`}
        title={getTranslation(label, i18n)}
      />
      {!(global.versions?.drafts && global.versions?.drafts?.autosave) && <LeaveWithoutSaving />}
      <SetStepNav global={global} />
      <DocumentControls
        apiURL={apiURL}
        data={data}
        global={global}
        hasSavePermission={hasSavePermission}
        isEditing
        permissions={permissions}
      />
      <DocumentFields
        description={description}
        fieldTypes={fieldTypes}
        fields={fields}
        hasSavePermission={hasSavePermission}
        permissions={permissions}
      />
    </React.Fragment>
  )
}
