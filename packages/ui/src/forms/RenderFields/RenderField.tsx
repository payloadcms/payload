'use client'

import type { ClientComponentProps, ClientField, FieldPermissions } from 'payload'

import React from 'react'

import { ArrayField } from '../../fields/Array/index.js'
import { BlocksField } from '../../fields/Blocks/index.js'
import { CollapsibleField } from '../../fields/Collapsible/index.js'
import { GroupField } from '../../fields/Group/index.js'
import { HiddenField } from '../../fields/Hidden/index.js'
import { RowField } from '../../fields/Row/index.js'
import { TabsField } from '../../fields/Tabs/index.js'
import { useFormFields } from '../../forms/Form/index.js'
import { useFieldComponents } from '../../providers/FieldComponents/index.js'

type RenderFieldProps = {
  clientFieldConfig: ClientField
  permissions: FieldPermissions
} & Pick<
  ClientComponentProps,
  | 'forceRender'
  | 'indexPath'
  | 'parentPath'
  | 'parentSchemaPath'
  | 'path'
  | 'readOnly'
  | 'schemaPath'
>

export function RenderField({
  clientFieldConfig,
  forceRender,
  indexPath,
  parentPath,
  parentSchemaPath,
  path,
  permissions,
  readOnly,
  schemaPath,
}: RenderFieldProps) {
  const fieldComponents = useFieldComponents()

  const Field = useFormFields(([fields]) => fields && fields?.[path]?.customComponents?.Field)

  if (Field !== undefined) {
    return Field || null
  }

  const sharedProps: Pick<
    ClientComponentProps,
    | 'forceRender'
    | 'indexPath'
    | 'parentPath'
    | 'parentSchemaPath'
    | 'path'
    | 'readOnly'
    | 'schemaPath'
  > = {
    forceRender,
    indexPath,
    parentPath,
    parentSchemaPath,
    path,
    readOnly,
    schemaPath,
  }

  if (clientFieldConfig.admin?.hidden) {
    return <HiddenField field={clientFieldConfig} {...sharedProps} />
  }

  const DefaultField = fieldComponents?.[clientFieldConfig?.type]

  switch (clientFieldConfig.type) {
    // named fields with subfields
    case 'array':
      return <ArrayField {...sharedProps} field={clientFieldConfig} permissions={permissions} />
    case 'blocks':
      return <BlocksField {...sharedProps} field={clientFieldConfig} permissions={permissions} />
    case 'collapsible':
      return (
        <CollapsibleField {...sharedProps} field={clientFieldConfig} permissions={permissions} />
      )
    case 'group':
      return <GroupField {...sharedProps} field={clientFieldConfig} permissions={permissions} />

    // unnamed fields with subfields
    case 'row':
      return <RowField {...sharedProps} field={clientFieldConfig} permissions={permissions} />
    case 'tabs':
      return <TabsField {...sharedProps} field={clientFieldConfig} permissions={permissions} />

    default:
      return DefaultField ? <DefaultField field={clientFieldConfig} {...sharedProps} /> : null
  }
}
