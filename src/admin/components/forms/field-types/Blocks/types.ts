import { Data } from '../../Form/types';
import { BlockField, Labels, Block } from '../../../../../fields/config/types';
import { FieldTypes } from '..';
import { FieldPermissions } from '../../../../../auth/types';
import { Description } from '../../FieldDescription/types';

export type Props = Omit<BlockField, 'type'> & {
  path?: string
  fieldTypes: FieldTypes
  permissions: FieldPermissions
}

export type RenderBlockProps = {
  path: string
  name: string
  fieldTypes: FieldTypes
  permissions: FieldPermissions
  onDragEnd: (result: any) => void
  label: string | false
  value: number
  readOnly: boolean
  minRows: number
  maxRows: number
  required: boolean
  labels: Labels
  addRow: (index: number, blockType: string) => Promise<void>
  removeRow: (index: number) => void
  moveRow: (fromIndex: number, toIndex: number) => void
  showError: boolean
  errorMessage: string
  rows: Data[]
  blocks: Block[]
  setCollapse: (id: string, collapsed: boolean) => void
  description?: Description
}
