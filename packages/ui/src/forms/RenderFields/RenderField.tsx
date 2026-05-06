'use client'

import type {
  ClientComponentProps,
  ClientField,
  FieldPaths,
  SanitizedFieldPermissions,
} from 'payload'

import { getFromImportMap } from 'payload/shared'
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
import { WatchCondition } from '../../forms/withCondition/WatchCondition.js'
import { useImportMap } from '../../providers/ImportMap/index.js'

type RenderFieldProps = {
  clientFieldConfig: ClientField
  permissions: SanitizedFieldPermissions
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
  const CustomField = useFormFields(([fields]) => fields && fields?.[path]?.customComponents?.Field)

  // Stable primitive selector — avoids new object references on every call which would cause
  // use-context-selector to perpetually dispatch re-renders (infinite loop with Lexical).
  const clientFieldComponentPathValue = useFormFields(
    ([fields]) => fields?.[path]?.clientFieldComponentPath,
  )

  const clientFieldComponentProps = useFormFields(
    ([fields]) => fields?.[path]?.clientFieldComponentProps,
  )

  const importMap = useImportMap()

  const baseFieldProps: Pick<
    ClientComponentProps,
    'forceRender' | 'permissions' | 'readOnly' | 'schemaPath'
  > = {
    forceRender,
    permissions,
    readOnly,
    schemaPath,
  }

  if (clientFieldConfig.admin?.hidden) {
    return <HiddenField {...baseFieldProps} path={path} />
  }

  // For richText fields with a clientFieldComponentPath, skip the CustomField check so the
  // import-map resolution in the switch/case below can provide the required extra props
  // (features, featureClientSchemaMap, etc.). Only do this when the import map is available
  // (non-RSC adapters like TanStack that mount ImportMapProvider). In Next.js the import map
  // context is null, so the RSC-rendered CustomField must be used instead.
  if (
    CustomField !== undefined &&
    !(clientFieldConfig.type === 'richText' && clientFieldComponentPathValue && importMap)
  ) {
    return CustomField || null
  }

  // For non-RSC adapters (e.g. TanStack Start): resolve custom Field component from the
  // client import map when `customComponents.Field` was stripped during serialization.
  // Skip richText fields — they have their own import-map resolution path in the switch below
  // that also passes `clientFieldComponentProps` (features, featureClientSchemaMap, etc.).
  if (clientFieldComponentPathValue && importMap && clientFieldConfig.type !== 'richText') {
    const componentPathStr =
      typeof clientFieldComponentPathValue === 'string'
        ? clientFieldComponentPathValue
        : (clientFieldComponentPathValue as { path: string }).path
    const clientProps =
      typeof clientFieldComponentPathValue === 'object' &&
      clientFieldComponentPathValue &&
      'clientProps' in clientFieldComponentPathValue
        ? (clientFieldComponentPathValue as { clientProps?: Record<string, unknown> }).clientProps
        : undefined
    const ResolvedCustomField = getFromImportMap<React.ComponentType<any>>({
      importMap,
      PayloadComponent: componentPathStr,
      schemaPath: '',
      silent: true,
    })

    if (ResolvedCustomField) {
      return (
        <WatchCondition path={path}>
          <ResolvedCustomField
            {...baseFieldProps}
            {...clientProps}
            clientField={clientFieldConfig}
            field={clientFieldConfig}
            path={path}
          />
        </WatchCondition>
      )
    }
  }

  const iterableFieldProps = {
    ...baseFieldProps,
    indexPath,
    parentPath,
    parentSchemaPath,
  }

  switch (clientFieldConfig.type) {
    case 'array':
      return <ArrayField {...iterableFieldProps} field={clientFieldConfig} path={path} />

    case 'blocks':
      return <BlocksField {...iterableFieldProps} field={clientFieldConfig} path={path} />

    case 'checkbox':
      return <CheckboxField {...baseFieldProps} field={clientFieldConfig} path={path} />

    case 'code':
      return <CodeField {...baseFieldProps} field={clientFieldConfig} path={path} />

    case 'collapsible':
      return <CollapsibleField {...iterableFieldProps} field={clientFieldConfig} path={path} />

    case 'date':
      return <DateTimeField {...baseFieldProps} field={clientFieldConfig} path={path} />

    case 'email':
      return <EmailField {...baseFieldProps} field={clientFieldConfig} path={path} />

    case 'group':
      return <GroupField {...iterableFieldProps} field={clientFieldConfig} path={path} />

    case 'join':
      return <JoinField {...baseFieldProps} field={clientFieldConfig} path={path} />

    case 'json':
      return <JSONField {...baseFieldProps} field={clientFieldConfig} path={path} />

    case 'number':
      return <NumberField {...baseFieldProps} field={clientFieldConfig} path={path} />

    case 'point':
      return <PointField {...baseFieldProps} field={clientFieldConfig} path={path} />

    case 'radio':
      return <RadioGroupField {...baseFieldProps} field={clientFieldConfig} path={path} />

    case 'relationship':
      return <RelationshipField {...baseFieldProps} field={clientFieldConfig} path={path} />

    case 'richText': {
      if (importMap && clientFieldComponentPathValue) {
        const ResolvedComponent = getFromImportMap<React.FC<any>>({
          importMap,
          PayloadComponent: clientFieldComponentPathValue,
          silent: true,
        })

        if (ResolvedComponent) {
          return (
            <ResolvedComponent
              {...baseFieldProps}
              {...clientFieldComponentProps}
              field={clientFieldConfig}
              importMap={importMap}
              path={path}
              schemaPath={schemaPath}
            />
          )
        }
      }

      return <RichTextField {...baseFieldProps} field={clientFieldConfig} path={path} />
    }

    case 'row':
      return <RowField {...iterableFieldProps} field={clientFieldConfig} />

    case 'select':
      return <SelectField {...baseFieldProps} field={clientFieldConfig} path={path} />

    case 'tabs':
      return <TabsField {...iterableFieldProps} field={clientFieldConfig} path={path} />

    case 'text':
      return <TextField {...baseFieldProps} field={clientFieldConfig} path={path} />

    case 'textarea':
      return <TextareaField {...baseFieldProps} field={clientFieldConfig} path={path} />

    case 'ui':
      return <UIField />

    case 'upload':
      return <UploadField {...baseFieldProps} field={clientFieldConfig} path={path} />
  }
}
