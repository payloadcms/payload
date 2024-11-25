import type {
  Data,
  DocumentPreferences,
  Field,
  FieldSchemaMap,
  FieldState,
  FormState,
  Operation,
  PayloadRequest,
  SanitizedFieldPermissions,
} from 'payload'

export type RenderFieldArgs = {
  collectionSlug: string
  data: Data
  fieldConfig: Field
  fieldSchemaMap: FieldSchemaMap
  fieldState: FieldState
  formState: FormState
  id?: number | string
  indexPath: string
  operation: Operation
  parentPath: string
  parentSchemaPath: string
  path: string
  permissions: SanitizedFieldPermissions
  preferences: DocumentPreferences
  previousFieldState: FieldState
  req: PayloadRequest
  schemaPath: string
  siblingData: Data
}

export type RenderFieldMethod = (args: RenderFieldArgs) => void
