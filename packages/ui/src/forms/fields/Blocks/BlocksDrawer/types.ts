import type { Labels } from 'payload/types'

import type { ReducedBlock } from '../../../../utilities/buildComponentMap/types.js'

export type Props = {
  addRow: (index: number, blockType?: string) => void
  addRowIndex: number
  blocks: ReducedBlock[]
  drawerSlug: string
  labels: Labels
}
