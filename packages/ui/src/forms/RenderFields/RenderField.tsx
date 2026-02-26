'use client'

import type {
  ClientComponentProps,
  ClientField,
  FieldPaths,
  SanitizedFieldPermissions,
} from 'payload'

import React, { useCallback, useEffect, useState } from 'react'

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
import { useAdminFieldConfig } from '../../providers/AdminConfig/useAdminFieldConfig.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'

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
  const { clientConfig, hasRscComponents } = useAdminFieldConfig(schemaPath)
  const { serverFunction } = useServerFunctions()

  const [rscNodes, setRscNodes] = useState<Record<string, React.ReactNode>>({})

  const fetchRscComponent = useCallback(
    async (componentSlot: string) => {
      if (!schemaPath) {
        return
      }
      try {
        const result = await serverFunction({
          name: 'render-admin-rsc',
          args: { componentSlot, schemaPath },
        })
        if (result && typeof result === 'object' && 'renderedComponent' in result) {
          setRscNodes((prev) => ({
            ...prev,
            [componentSlot]: (result as any).renderedComponent,
          }))
        }
      } catch (_err) {
        // RSC rendering failed, fall through to default
      }
    },
    [schemaPath, serverFunction],
  )

  useEffect(() => {
    if (hasRscComponents) {
      void fetchRscComponent('Field')
      void fetchRscComponent('Label')
      void fetchRscComponent('Description')
    }
  }, [hasRscComponents, fetchRscComponent])

  const AdminFieldComponent = clientConfig?.components?.Field ?? rscNodes.Field
  const AdminLabel = clientConfig?.components?.Label ?? rscNodes.Label
  const AdminDescription = clientConfig?.components?.Description ?? rscNodes.Description
  const AdminError = clientConfig?.components?.Error ?? rscNodes.Error
  const AdminBeforeInput = clientConfig?.components?.BeforeInput ?? rscNodes.BeforeInput
  const AdminAfterInput = clientConfig?.components?.AfterInput ?? rscNodes.AfterInput
  const adminValidate = clientConfig?.validate

  const baseFieldProps: { validate?: any } & Pick<
    ClientComponentProps,
    'forceRender' | 'permissions' | 'readOnly' | 'schemaPath'
  > = {
    forceRender,
    permissions,
    readOnly,
    schemaPath,
  }

  if (adminValidate) {
    baseFieldProps.validate = adminValidate
  }

  const fieldComponentProps = { field: clientFieldConfig, path, schemaPath }

  const renderAdminComponent = (Comp: typeof AdminLabel) => {
    if (!Comp) {
      return null
    }
    if (typeof Comp === 'function') {
      const C = Comp as React.ComponentType<any>
      return <C {...fieldComponentProps} />
    }
    return Comp
  }

  const renderAdminComponentArray = (comps: typeof AdminBeforeInput) => {
    if (!comps) {
      return null
    }
    if (Array.isArray(comps)) {
      return comps.map((Comp, i) => {
        if (typeof Comp === 'function') {
          const C = Comp as React.ComponentType<any>
          return <C key={i} {...fieldComponentProps} />
        }
        return <React.Fragment key={i}>{Comp}</React.Fragment>
      })
    }
    if (typeof comps === 'function') {
      const C = comps as React.ComponentType<any>
      return <C {...fieldComponentProps} />
    }
    return comps as React.ReactNode
  }

  if (clientFieldConfig.admin?.hidden) {
    return <HiddenField forceRender={forceRender} path={path} schemaPath={schemaPath} />
  }

  if (AdminFieldComponent) {
    if (typeof AdminFieldComponent !== 'function') {
      return AdminFieldComponent as React.ReactNode
    }
    const FieldComp = AdminFieldComponent as React.ComponentType<any>
    if (AdminLabel || AdminDescription || AdminError || AdminBeforeInput || AdminAfterInput) {
      return (
        <div data-admin-config-field={schemaPath}>
          {renderAdminComponent(AdminLabel)}
          {renderAdminComponent(AdminError)}
          {renderAdminComponentArray(AdminBeforeInput)}
          <FieldComp {...baseFieldProps} field={clientFieldConfig} path={path} />
          {renderAdminComponentArray(AdminAfterInput)}
          {renderAdminComponent(AdminDescription)}
        </div>
      )
    }
    return <FieldComp {...baseFieldProps} field={clientFieldConfig} path={path} />
  }

  if (CustomField !== undefined) {
    return CustomField || null
  }

  const iterableFieldProps = {
    ...baseFieldProps,
    indexPath,
    parentPath,
    parentSchemaPath,
  }

  const hasAdminWrapper =
    AdminLabel || AdminDescription || AdminError || AdminBeforeInput || AdminAfterInput

  const renderDefaultField = () => {
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

      case 'richText':
        return <RichTextField {...baseFieldProps} field={clientFieldConfig} path={path} />

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

      default:
        return null
    }
  }

  if (hasAdminWrapper) {
    return (
      <div data-admin-config-field={schemaPath}>
        {renderAdminComponent(AdminLabel)}
        {renderAdminComponent(AdminError)}
        {renderAdminComponentArray(AdminBeforeInput)}
        {renderDefaultField()}
        {renderAdminComponentArray(AdminAfterInput)}
        {renderAdminComponent(AdminDescription)}
      </div>
    )
  }

  return renderDefaultField()
}
