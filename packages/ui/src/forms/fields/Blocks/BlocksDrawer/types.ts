import type { Labels } from 'payload/types'
import { ReducedBlock } from '../../../utilities/buildFieldMaps/types'

export type Props = {
  addRow: (index: number, blockType?: string) => void
  addRowIndex: number
  blocks: ReducedBlock[]
  drawerSlug: string
  labels: Labels
}
