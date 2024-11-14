'use client'

import type { ClientComponentProps, ClientField, FieldPaths, FieldPermissions } from 'payload'

import React from 'react'

import { ArrayField } from '../../fields/Array/index.js'
import { BlocksField } from '../../fields/Blocks/index.js'
import { CheckboxField } from '../../fields/Checkbox/index.js'
import { CodeField } from '../../fields/Code/index.js'
import { CollapsibleField } from '../../fields/Collapsible/index.js'
import { DateTimeField } from '../../fields/DateTime/index.js'
import { EmailField } from '../../fields/Email/index.js'
import { GroupField } from '../../fields/Group/index.js'
import { HiddenField } from '../../fields/Hidden/index.js'
import { JoinField } from '../../fields/Join/index.js'
import { JSONField } from '../../fields/JSON/index.js'
import { NumberField } from '../../fields/Number/index.js'
import { PointField } from '../../fields/Point/index.js'
import { RadioGroupField } from '../../fields/RadioGroup/index.js'
import { RelationshipField } from '../../fields/Relationship/index.js'
import { RichTextField } from '../../fields/RichText/index.js'
import { RowField } from '../../fields/Row/index.js'
import { SelectField } from '../../fields/Select/index.js'
import { TabsField } from '../../fields/Tabs/index.js'
import { TextField } from '../../fields/Text/index.js'
import { TextareaField } from '../../fields/Textarea/index.js'
import { UIField } from '../../fields/UI/index.js'
import { UploadField } from '../../fields/Upload/index.js'
import { useFormFields } from '../../forms/Form/index.js'

type BaseFieldProps = Omit<FieldPaths, 'indexPath'> &
  Pick<ClientComponentProps, 'forceRender' | 'readOnly' | 'schemaPath'>

type IterableFieldProps = {
  indexPath: string
  permissions: FieldPermissions
} & BaseFieldProps

type RenderFieldProps = {
  clientFieldConfig: ClientField
  permissions: FieldPermissions
} & FieldPaths &
  Pick<ClientComponentProps, 'forceRender' | 'readOnly' | 'schemaPath'>

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
  const Field = useFormFields(([fields]) => fields && fields?.[path]?.customComponents?.Field)

  if (Field !== undefined) {
    return Field || null
  }

  const baseFieldProps: BaseFieldProps = {
    forceRender,
    parentPath,
    parentSchemaPath,
    path,
    readOnly,
    schemaPath,
  }

  const iterableFieldProps: IterableFieldProps = {
    ...baseFieldProps,
    indexPath,
    permissions,
  }

  if (clientFieldConfig.admin?.hidden) {
    return <HiddenField {...baseFieldProps} />
  }

  switch (clientFieldConfig.type) {
    case 'array':
      return <ArrayField {...iterableFieldProps} field={clientFieldConfig} />

    case 'blocks':
      return <BlocksField {...iterableFieldProps} field={clientFieldConfig} />

    case 'checkbox':
      return <CheckboxField {...baseFieldProps} field={clientFieldConfig} />

    case 'code':
      return <CodeField {...baseFieldProps} field={clientFieldConfig} />

    case 'collapsible':
      return <CollapsibleField {...iterableFieldProps} field={clientFieldConfig} />

    case 'date':
      return <DateTimeField {...baseFieldProps} field={clientFieldConfig} />

    case 'email':
      return <EmailField {...baseFieldProps} field={clientFieldConfig} />

    case 'group':
      return <GroupField {...iterableFieldProps} field={clientFieldConfig} />

    case 'join':
      return <JoinField {...baseFieldProps} field={clientFieldConfig} />

    case 'json':
      return <JSONField {...baseFieldProps} field={clientFieldConfig} />

    case 'number':
      return <NumberField {...baseFieldProps} field={clientFieldConfig} />

    case 'point':
      return <PointField {...baseFieldProps} field={clientFieldConfig} />

    case 'radio':
      return <RadioGroupField {...baseFieldProps} field={clientFieldConfig} />

    case 'relationship':
      return <RelationshipField {...baseFieldProps} field={clientFieldConfig} />

    case 'richText':
      return <RichTextField {...baseFieldProps} field={clientFieldConfig} />

    case 'row':
      return <RowField {...iterableFieldProps} field={clientFieldConfig} />

    case 'select':
      return <SelectField {...baseFieldProps} field={clientFieldConfig} />

    case 'tabs':
      return <TabsField {...iterableFieldProps} field={clientFieldConfig} />

    case 'text':
      return <TextField {...baseFieldProps} field={clientFieldConfig} />

    case 'textarea':
      return <TextareaField {...baseFieldProps} field={clientFieldConfig} />

    case 'ui':
      return <UIField />

    case 'upload':
      return <UploadField {...baseFieldProps} field={clientFieldConfig} />
  }
}
