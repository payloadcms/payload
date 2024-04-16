'use client'
import type { FieldMap } from '@payloadcms/ui/utilities/buildComponentMap'
import type { FieldTypes } from 'payload/config'

import { RenderFields } from '@payloadcms/ui/forms/RenderFields'
import { useComponentMap } from '@payloadcms/ui/providers/ComponentMap'
import React from 'react'

export const CreateFirstUserFields: React.FC<{
  createFirstUserFieldMap: FieldMap
  userSlug: string
}> = ({ createFirstUserFieldMap, userSlug }) => {
  const { getFieldMap } = useComponentMap()

  const fieldMap = getFieldMap({ collectionSlug: userSlug })

  const firstUserFieldMapWithPasswordFields = createFirstUserFieldMap.map((field) => {
    if (field.name === 'password') {
      const type: keyof FieldTypes = 'password'

      return {
        ...field,
        type,
      }
    }
    if (field.name === 'confirm-password') {
      const type: keyof FieldTypes = 'confirmPassword'

      return {
        ...field,
        type,
      }
    }
    return field
  })

  return (
    <RenderFields
      fieldMap={[...(firstUserFieldMapWithPasswordFields || []), ...(fieldMap || [])]}
      operation="create"
      path=""
      readOnly={false}
      schemaPath={userSlug}
    />
  )
}
