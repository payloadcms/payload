'use client'

import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { FormSubmit, RenderFields, useForm, useTranslation } from '@payloadcms/ui'
import React, { useCallback } from 'react'

import type { FieldsDrawerProps } from './Drawer.js'

import { useEditorConfigContext } from '../../lexical/config/client/EditorConfigProvider.js'

export const DrawerContent: React.FC<Omit<FieldsDrawerProps, 'drawerSlug' | 'drawerTitle'>> = ({
  featureKey,
  fieldMapOverride,
  handleDrawerSubmit,
  nodeId,
  schemaFieldsPathOverride,
  schemaPath,
  schemaPathSuffix,
}) => {
  const { t } = useTranslation()
  const isEditable = useLexicalEditable()
  const { fields: formFields, getDataByPath } = useForm()

  const {
    fieldProps: { featureClientSchemaMap, path },
  } = useEditorConfigContext()

  const schemaFieldsPath =
    schemaFieldsPathOverride ??
    `${schemaPath}.lexical_internal_feature.${featureKey}${schemaPathSuffix ? `.${schemaPathSuffix}` : ''}`

  const fields: any = fieldMapOverride ?? featureClientSchemaMap[featureKey]?.[schemaFieldsPath]

  const parentPath = nodeId ? `${path}.${nodeId}` : ''

  const onClick = useCallback(() => {
    const data = nodeId ? (getDataByPath(parentPath) ?? {}) : {}
    handleDrawerSubmit(formFields, data)
  }, [nodeId, parentPath, getDataByPath, formFields, handleDrawerSubmit])

  return (
    <>
      <RenderFields
        fields={Array.isArray(fields) ? fields : []}
        forceRender
        parentIndexPath=""
        parentPath={parentPath}
        parentSchemaPath={schemaFieldsPath}
        permissions={true}
        readOnly={!isEditable}
      />
      <FormSubmit onClick={onClick}>{t('fields:saveChanges')}</FormSubmit>
    </>
  )
}
