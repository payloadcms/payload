import type { Option, SelectFieldServerProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { HierarchyTypeField } from './index.js'

type HierarchyTypeFieldServerProps = {
  collectionOptions: Option[]
  parentFieldName: string
} & SelectFieldServerProps

export const HierarchyTypeFieldServer: React.FC<HierarchyTypeFieldServerProps> = ({
  clientField,
  collectionOptions,
  i18n,
  parentFieldName,
  path,
  permissions,
  readOnly,
}) => {
  const translatedOptions: Option[] = collectionOptions.map((option) => {
    if (typeof option === 'object' && 'label' in option) {
      return {
        ...option,
        label: getTranslation(option.label, i18n),
      }
    }
    return option
  })

  return (
    <HierarchyTypeField
      field={clientField}
      options={translatedOptions}
      parentFieldName={parentFieldName}
      path={path}
      permissions={permissions}
      readOnly={readOnly}
    />
  )
}
