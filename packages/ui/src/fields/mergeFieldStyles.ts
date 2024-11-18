import type { ClientField } from 'payload'

export const mergeFieldStyles = (
  field: ClientField | Omit<ClientField, 'type'>,
): React.CSSProperties => ({
  ...(field?.admin?.style || {}),
  ...(field?.admin?.width
    ? {
        '--field-width': field.admin.width,
      }
    : {}),
})
