import type { ClientField, FormState } from 'payload'

export type Props = {
  readonly drawerSlug: string
  readonly fields: ClientField[]
  readonly handleClose: () => void
  readonly handleModalSubmit: (fields: FormState, data: Record<string, unknown>) => void
  readonly initialState?: FormState
  readonly schemaPath: string
}
