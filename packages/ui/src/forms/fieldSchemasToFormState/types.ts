import type {
  Data,
  DocumentPermissions,
  Field,
  FieldSchemaMap,
  FieldState,
  FormState,
  PayloadRequest,
} from 'payload'

export type RenderFieldArgs = {
  data: Data
  fieldConfig: Field
  fieldSchemaMap: FieldSchemaMap
  fieldState: FieldState
  formState: FormState
  indexPath: string
  parentPath: string
  parentSchemaPath: string
  path: string
  permissions: DocumentPermissions['fields']
  previousFieldState: FieldState
  req: PayloadRequest
  schemaPath: string
  siblingData: Data
}

export type RenderFieldMethod = (args: RenderFieldArgs) => Promise<void>
