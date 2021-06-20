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
  id: string
  isCollapsed?: boolean
  setRowCollapse?: (id: string, open: boolean) => void
  positionPanelVerticalAlignment?: 'top' | 'center' | 'sticky'
  actionPanelVerticalAlignment?: 'top' | 'center' | 'sticky'
  permissions: FieldPermissions
  readOnly: boolean
  blocks?: Block[]
  hasMaxRows?: boolean
}
