import type {
  Data,
  Field,
  FormField,
  FormState,
  SanitizedDocumentPermissions,
  SanitizedFieldsPermissions,
  TypedUser,
} from 'payload'

import React from 'react'

import { Form } from '../../forms/Form/index.js'
import { RenderFields } from '../../forms/RenderFields/index.js'
import { DocumentInfoProvider } from '../../providers/DocumentInfo/index.js'
import { EditDepthProvider } from '../../providers/EditDepth/index.js'
import { OperationProvider } from '../../providers/Operation/index.js'

const storybookUser: TypedUser = {
  id: 'storybook-user',
  collection: 'users',
  createdAt: new Date().toISOString(),
  email: 'storybook@example.com',
  updatedAt: new Date().toISOString(),
}

const storybookDocPermissions: SanitizedDocumentPermissions = {
  create: true,
  delete: true,
  fields: {} as SanitizedFieldsPermissions,
  read: true,
  update: true,
}

const fullAccessFieldsPermissions = true as SanitizedFieldsPermissions

const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  width: '100%',
}

type FormValueConfig = ({ value?: unknown } & Partial<FormField>) | unknown

const isFormFieldConfig = (value: unknown): value is Partial<FormField> => {
  if (value === null || Array.isArray(value)) {
    return false
  }

  if (typeof value !== 'object') {
    return false
  }

  return (
    'value' in value ||
    'initialValue' in value ||
    'rows' in value ||
    'errorMessage' in value ||
    'valid' in value ||
    'passesCondition' in value
  )
}

const buildFieldState = (value: FormValueConfig): FormField => {
  if (isFormFieldConfig(value)) {
    const formField: FormField = {
      passesCondition: true,
      valid: true,
      ...value,
    } as FormField

    if (typeof formField.initialValue === 'undefined') {
      formField.initialValue = formField.value ?? null
    }

    if (typeof formField.value === 'undefined') {
      formField.value = formField.initialValue ?? null
    }

    return formField
  }

  return {
    initialValue: value,
    passesCondition: true,
    valid: true,
    value,
  }
}

export const buildFormState = (values?: Record<string, FormValueConfig>): FormState => {
  if (!values) {
    return {}
  }

  return Object.entries(values).reduce<FormState>((state, [path, value]) => {
    state[path] = buildFieldState(value)
    return state
  }, {})
}

export type FieldStoryWrapperProps = {
  children?: React.ReactNode
  collectionSlug?: string
  field?: Field
  fields?: Field[]
  initialData?: Data
  initialState?: FormState
  style?: React.CSSProperties
  submitted?: boolean
  values?: Record<string, FormValueConfig>
  width?: number | string
}

export const FieldStoryWrapper: React.FC<FieldStoryWrapperProps> = ({
  children,
  collectionSlug = 'posts',
  field,
  fields,
  initialData,
  initialState,
  style,
  submitted = false,
  values,
  width = 480,
}) => {
  const resolvedFields = fields ?? (field ? [field] : [])

  const memoizedState = React.useMemo<FormState>(() => {
    if (initialState) {
      return initialState
    }

    return buildFormState(values)
  }, [initialState, values])

  const memoizedData = React.useMemo<Data>(
    () => ({
      id: documentId,
      ...(initialData ?? {}),
    }),
    [initialData, documentId],
  )

  const documentId = React.useMemo(() => `storybook-doc-${field?.name ?? 'field'}`, [field?.name])

  if (!resolvedFields.length && !children) {
    return null
  }

  return (
    <DocumentInfoProvider
      collectionSlug={collectionSlug}
      currentEditor={storybookUser}
      docPermissions={storybookDocPermissions}
      hasPublishedDoc={false}
      hasPublishPermission={true}
      hasSavePermission={true}
      id={documentId}
      initialData={memoizedData}
      initialState={memoizedState}
      isEditing={false}
      isLocked={false}
      lastUpdateTime={Date.now()}
      mostRecentVersionIsAutosaved={false}
      unpublishedVersionCount={0}
      versionCount={1}
    >
      <OperationProvider operation="create">
        <EditDepthProvider>
          <Form action="/storybook" initialState={memoizedState} submitted={submitted}>
            <div
              style={{
                ...containerStyles,
                ...style,
                maxWidth: width,
              }}
            >
              {resolvedFields.length > 0 && (
                <RenderFields fields={resolvedFields} permissions={fullAccessFieldsPermissions} />
              )}
              {children}
            </div>
          </Form>
        </EditDepthProvider>
      </OperationProvider>
    </DocumentInfoProvider>
  )
}
