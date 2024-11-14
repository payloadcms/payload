import type {
  BlockAsField,
  Data,
  DocumentPermissions,
  Field,
  FieldSchemaMap,
  FieldState,
  FormState,
  Operation,
  PayloadRequest,
} from 'payload'

export type RenderFieldArgs = {
  data: Data
  fieldConfig: BlockAsField | Field
  fieldSchemaMap: FieldSchemaMap
  fieldState: FieldState
  formState: FormState
  indexPath: string
  operation: Operation
  parentPath: string
  parentSchemaPath: string
  path: string
  permissions: DocumentPermissions['fields']
  previousFieldState: FieldState
  req: PayloadRequest
  schemaPath: string
  siblingData: Data
}

export type RenderFieldMethod = (args: RenderFieldArgs) => void
