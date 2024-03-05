'use client'
import { FieldMap, RenderFields, useComponentMap } from '@payloadcms/ui'
import React from 'react'

export const CreateFirstUserFields: React.FC<{
  userSlug: string
  createFirstUserFieldMap: FieldMap
}> = ({ userSlug, createFirstUserFieldMap }) => {
  const { getFieldMap } = useComponentMap()

  const fieldMap = getFieldMap({ collectionSlug: userSlug })

  return <RenderFields fieldMap={[...(fieldMap || []), ...(createFirstUserFieldMap || [])]} />
}
