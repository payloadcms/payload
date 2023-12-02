import type { Block, Labels } from 'payload/types'

export type Props = {
  addRow: (index: number, blockType?: string) => void
  addRowIndex: number
  blocks: Block[]
  drawerSlug: string
  labels: Labels
}
