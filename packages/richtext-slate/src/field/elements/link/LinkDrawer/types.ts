import type { ClientFieldConfig, FormState } from 'payload'

export type Props = {
  drawerSlug: string
  fields: ClientFieldConfig[]
  handleClose: () => void
  handleModalSubmit: (fields: FormState, data: Record<string, unknown>) => void
  initialState?: FormState
}
