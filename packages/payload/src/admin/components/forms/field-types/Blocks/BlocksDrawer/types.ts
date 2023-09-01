import type { Block, Labels } from '../../../../../../fields/config/types'

export type Props = {
  addRow: (index: number, blockType?: string) => void
  addRowIndex: number
  blocks: Block[]
  drawerSlug: string
  labels: Labels
}
