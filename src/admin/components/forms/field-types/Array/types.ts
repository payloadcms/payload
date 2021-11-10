import { Data } from '../../Form/types';
import { ArrayField, Labels, Field } from '../../../../../fields/config/types';
import { FieldTypes } from '..';
import { FieldPermissions } from '../../../../../auth/types';
import { Description } from '../../FieldDescription/types';

export type Props = Omit<ArrayField, 'type'> & {
  path?: string
  fieldTypes: FieldTypes
  permissions: FieldPermissions
  label: string | false
}

export type RenderArrayProps = {
  path: string
  name: string
  fieldTypes: FieldTypes
  fields: Field[]
  permissions: FieldPermissions
  onDragEnd: (result: any) => void
  label: string | false
  value: number
  readOnly: boolean
  minRows: number
  maxRows: number
  required: boolean
  labels: Labels
  addRow: (index: number) => Promise<void>
  removeRow: (index: number) => void
  moveRow: (fromIndex: number, toIndex: number) => void
  showError: boolean
  errorMessage: string
  rows: Data[]
  description?: Description
}
