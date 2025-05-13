import type {
  ClientFieldSchemaMap,
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
  clientFieldSchemaMap?: ClientFieldSchemaMap
  collectionSlug: string
  data: Data
  fieldConfig: Field
  fieldSchemaMap: FieldSchemaMap
  fieldState: FieldState
  formState: FormState
  id?: number | string
  indexPath: string
  lastRenderedPath: string
  mockRSCs?: boolean
  operation: Operation
  parentPath: string
  parentSchemaPath: string
  path: string
  permissions: SanitizedFieldPermissions
  preferences: DocumentPreferences
  previousFieldState: FieldState
  renderAllFields: boolean
  req: PayloadRequest
  schemaPath: string
  siblingData: Data
}

export type RenderFieldMethod = (args: RenderFieldArgs) => void
