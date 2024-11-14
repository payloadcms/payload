import type {
  Data,
  Field,
  FieldSchemaMap,
  FieldState,
  FormState,
  Operation,
  PayloadRequest,
  SanitizedDocumentPermissions,
} from 'payload'

export type RenderFieldArgs = {
  data: Data
  fieldConfig: Field
  fieldSchemaMap: FieldSchemaMap
  fieldState: FieldState
  formState: FormState
  indexPath: string
  operation: Operation
  parentPath: string
  parentSchemaPath: string
  path: string
  permissions: SanitizedDocumentPermissions['fields']
  previousFieldState: FieldState
  req: PayloadRequest
  schemaPath: string
  siblingData: Data
}

export type RenderFieldMethod = (args: RenderFieldArgs) => void
