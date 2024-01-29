import type { Labels } from 'payload/types'
import { ReducedBlock } from '../../../RenderFields/buildFieldMap'

export type Props = {
  addRow: (index: number, blockType?: string) => void
  addRowIndex: number
  blocks: ReducedBlock[]
  drawerSlug: string
  labels: Labels
}
