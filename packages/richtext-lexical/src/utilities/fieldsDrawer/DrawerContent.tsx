'use client'

import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { FormSubmit, RenderFields, useForm, useTranslation } from '@payloadcms/ui'
import React, { useCallback } from 'react'

import type { FieldsDrawerProps } from './Drawer.js'

import { useEditorConfigContext } from '../../lexical/config/client/EditorConfigProvider.js'
import { RenderLexicalFields } from '../RenderLexicalFields.js'

export const DrawerContent: React.FC<Omit<FieldsDrawerProps, 'drawerSlug' | 'drawerTitle'>> = ({
  featureKey,
  fieldMapOverride,
  handleDrawerSubmit,
  nodeId,
  nodeKey,
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

  const fieldProps = {
    fields: Array.isArray(fields) ? fields : [],
    forceRender: true as const,
    parentIndexPath: '',
    parentPath,
    parentSchemaPath: schemaFieldsPath,
    permissions: true as const,
    readOnly: !isEditable,
  }

  return (
    <>
      {nodeKey ? (
        <RenderLexicalFields {...fieldProps} nodeKey={nodeKey} />
      ) : (
        <RenderFields {...fieldProps} />
      )}
      <FormSubmit onClick={onClick}>{t('fields:saveChanges')}</FormSubmit>
    </>
  )
}
