import type { ClientFieldConfig, FormState } from 'payload'

export type Props = {
  readonly drawerSlug: string
  readonly fields: ClientFieldConfig[]
  readonly handleClose: () => void
  readonly handleModalSubmit: (fields: FormState, data: Record<string, unknown>) => void
  readonly initialState?: FormState
}
