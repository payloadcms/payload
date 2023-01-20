import { Block } from '../../../../../../../fields/config/types';

export type Props = {
  addRow: (i: number, block: string) => void
  addRowIndex: number
  block: Block
  onClick?: () => void
}
