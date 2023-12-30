import React from 'react'

import type { FieldTypes } from '../../../forms/field-types'
import type { GlobalEditViewProps } from '../../types'

import { DocumentControls } from '../../../elements/DocumentControls'
import { DocumentFields } from '../../../elements/DocumentFields'
import { LeaveWithoutSaving } from '../../../elements/LeaveWithoutSaving'
import { SetStepNav } from '../../Edit/SetStepNav'

export const DefaultGlobalEdit: React.FC<
  GlobalEditViewProps & {
    fieldTypes: FieldTypes
  }
> = (props) => {
  const { apiURL, data, fieldTypes, globalConfig, permissions, config } = props

  const { admin: { description } = {}, fields, label } = globalConfig

  const hasSavePermission = permissions?.update?.permission

  return (
    <React.Fragment>
      {!(globalConfig.versions?.drafts && globalConfig.versions?.drafts?.autosave) && (
        <LeaveWithoutSaving />
      )}
      <SetStepNav globalSlug={globalConfig.slug} globalLabel={label} />
      <DocumentControls
        apiURL={apiURL}
        data={data}
        config={config}
        globalConfig={globalConfig}
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
