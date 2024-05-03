import type { FormState } from 'payload/types'

import type { LinkFields } from '../nodes/types.js'

export interface Props {
  drawerSlug: string
  handleModalSubmit: (fields: FormState, data: Record<string, unknown>) => void
  stateData?: LinkFields & { text: string }
}
