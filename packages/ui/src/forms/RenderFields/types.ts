import type { ClientComponentProps, ClientField, SanitizedFieldPermissions } from 'payload'

export type RenderFieldsProps = Pick<ClientComponentProps, 'forceRender'> & {
  readonly className?: string
  readonly fields: ClientField[]
  readonly parentIndexPath: string
  readonly parentPath: string
  readonly parentSchemaPath: string
  readonly permissions:
    | SanitizedFieldPermissions
    | {
        [fieldName: string]: SanitizedFieldPermissions
      }
  readonly readOnly?: boolean
}
