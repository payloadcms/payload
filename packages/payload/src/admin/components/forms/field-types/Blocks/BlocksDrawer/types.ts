import { Block, Labels } from '../../../../../../fields/config/types.js';

export type Props = {
  drawerSlug: string
  blocks: Block[]
  addRow: (index: number, blockType?: string) => void
  addRowIndex: number
  labels: Labels
}
