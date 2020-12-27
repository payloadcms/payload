import { Field, Block } from '../../../../fields/config/types';
import { FieldTypes } from '../field-types';
import { FieldPermissions } from '../../../../auth/types';

export type Props = {
  moveRow: (fromIndex: number, toIndex: number) => void
  addRow: (index: number, blockType?: string) => void
  removeRow: (index: number) => void
  rowIndex: number
  rowCount: number
  parentPath: string
  fieldSchema: Field[],
  label?: string
  blockType?: string
  fieldTypes: FieldTypes
  toggleRowCollapse?: (index: number) => void
  id: string
  positionPanelVerticalAlignment?: 'top' | 'center' | 'sticky'
  actionPanelVerticalAlignment?: 'top' | 'center' | 'sticky'
  permissions: FieldPermissions
  isOpen?: boolean
  readOnly: boolean
  blocks?: Block[]
  hasMaxRows?: boolean
}
