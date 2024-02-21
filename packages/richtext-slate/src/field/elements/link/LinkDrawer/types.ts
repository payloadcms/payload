import type { FieldMap, FormState } from '@payloadcms/ui'

export type Props = {
  drawerSlug: string
  fieldMap: FieldMap
  handleClose: () => void
  handleModalSubmit: (fields: FormState, data: Record<string, unknown>) => void
  initialState?: FormState
}
