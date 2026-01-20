import type {
  ClientComponentProps,
  ClientField,
  ParentFieldPaths,
  SanitizedFieldPermissions,
} from 'payload'

export type RenderFieldsProps = {
  readonly className?: string
  readonly fields: ClientField[]
  readonly margins?: 'small' | false
  readonly permissions:
    | {
        [fieldName: string]: SanitizedFieldPermissions
      }
    | SanitizedFieldPermissions
  readonly readOnly?: boolean
} & Pick<ClientComponentProps, 'forceRender'> &
  Required<ParentFieldPaths>
