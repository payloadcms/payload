import { CollectionPermission, GlobalPermission } from '../../../../auth/types';
import { Field } from '../../../../fields/config/types';

export type Operation = 'create' | 'update'

export type Context = {
  operation: Operation
}

export type Props = {
  className?: string
  operation: Operation
  readOnly: boolean
  permissions: CollectionPermission | GlobalPermission
  filter: (field: Field) => boolean
  fieldSchema: Field[]
}
