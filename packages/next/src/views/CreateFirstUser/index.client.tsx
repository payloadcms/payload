'use client'
import type { FieldMap } from '@payloadcms/ui/utilities/buildComponentMap'

import { RenderFields } from '@payloadcms/ui/forms/RenderFields'
import { useComponentMap } from '@payloadcms/ui/providers/ComponentMap'
import React from 'react'

export const CreateFirstUserFields: React.FC<{
  baseAuthFieldMap: FieldMap
  userSlug: string
}> = ({ baseAuthFieldMap, userSlug }) => {
  const { getFieldMap } = useComponentMap()

  const fieldMap = getFieldMap({ collectionSlug: userSlug })

  return (
    <RenderFields
      fieldMap={[...(baseAuthFieldMap || []), ...(fieldMap || [])]}
      operation="create"
      path=""
      readOnly={false}
      schemaPath={userSlug}
    />
  )
}
