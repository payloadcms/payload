import type {
  ClientFieldSchemaMap,
  Data,
  DocumentPreferences,
  Field,
  FieldPaths,
  FieldSchemaMap,
  FieldState,
  FormState,
  Operation,
  ParentFieldPaths,
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
  /**
   * If set to true, it will force creating a clientField based on the passed fieldConfig instead of pulling
   * the client field from the clientFieldSchemaMap. This is useful if the passed fieldConfig differs from the one in the schema map,
   * e.g. when calling the render-field server function and passing a field config override.
   */
  forceCreateClientField?: boolean
  formState: FormState
  id?: number | string
  lastRenderedPath: string
  mockRSCs?: boolean
  operation: Operation
  permissions: SanitizedFieldPermissions
  preferences: DocumentPreferences
  previousFieldState: FieldState
  readOnly?: boolean
  renderAllFields: boolean
  req: PayloadRequest
  siblingData: Data
} & Required<FieldPaths> &
  Required<Omit<ParentFieldPaths, 'parentIndexPath'>>

export type RenderFieldMethod = (args: RenderFieldArgs) => void
