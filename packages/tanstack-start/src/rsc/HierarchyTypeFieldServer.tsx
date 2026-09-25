import type { Option, SelectFieldServerProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { HierarchyTypeField } from '@payloadcms/ui'
import React from 'react'

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
  // TODO(tanstack-start): in some RSC entry paths the `serverProps` declared
  // on `admin.components.Field` (in `resolveHierarchyCollections.ts`) are not
  // propagated to this component, leaving `collectionOptions` undefined. The
  // Next.js adapter renders this identical component with the same config and
  // always receives the prop, so the bug is in the tanstack-start renderer
  // (likely `AdminView.tsx#renderComponentWithServerProps` / import-map
  // resolution). Until that is fixed, default to an empty options list so the
  // entire admin view doesn't crash with `Cannot read properties of undefined
  // (reading 'map')`.
  const safeCollectionOptions: Option[] = collectionOptions ?? []
  const translatedOptions: Option[] = safeCollectionOptions.map((option) => {
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
