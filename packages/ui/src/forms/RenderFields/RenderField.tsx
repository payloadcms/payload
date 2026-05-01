'use client'

import type {
  ClientComponentProps,
  ClientField,
  FieldPaths,
  SanitizedFieldPermissions,
} from 'payload'

import React from 'react'

import { ShimmerEffect } from '../../elements/ShimmerEffect/index.js'
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
import { useOptionalPendingServerFieldPaths } from '../../providers/PendingServerFieldPaths/index.js'
import { WatchCondition } from '../withCondition/WatchCondition.js'

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
  const pendingServerFieldPaths = useOptionalPendingServerFieldPaths()

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

  if (CustomField !== undefined) {
    if (CustomField === null) {
      return null
    }
    // Wrap the user's custom component in WatchCondition so its entire
    // subtree (not just the inner default field, which has its own
    // withCondition HOC) unmounts when the condition turns false. Without
    // this wrap the user's outer wrapper persists across toggles —
    // `useState` and `useEffect` initialized on the first reveal carry
    // through subsequent hide/show cycles, so timestamps and other
    // mount-time effects never refresh on later reveals.
    return <WatchCondition path={path}>{CustomField}</WatchCondition>
  }

  // Phase 14: when the schema declares a server-classified custom Field at
  // this path but the rendered React element hasn't landed yet (initial
  // build skipped it because the condition was false; or `renderFields` is
  // still in flight after a visibility flip / ADD_ROW), render a shimmer
  // instead of the default field. Wrapped in WatchCondition so the
  // shimmer only shows once the condition is true — otherwise hidden
  // fields would also paint a shimmer for no visible reason.
  if (pendingServerFieldPaths?.matches(path)) {
    return (
      <WatchCondition path={path}>
        <ShimmerEffect height="3rem" />
      </WatchCondition>
    )
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
  }
}
