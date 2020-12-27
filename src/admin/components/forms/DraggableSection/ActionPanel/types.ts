import { Block } from '../../../../../fields/config/types';

export type Props = {
  label: string
  addRow?: (index: number, blockType?: string) => void
  removeRow?: (index: number) => void
  blockType?: string
  isHovered: boolean
  rowIndex: number
  blocks?: Block[]
  hasMaxRows?: boolean
}
