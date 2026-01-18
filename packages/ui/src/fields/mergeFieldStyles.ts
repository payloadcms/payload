import type { ClientField } from 'payload'

export const mergeFieldStyles = (
  field: ClientField | Omit<ClientField, 'type'>,
): React.CSSProperties => ({
  ...(field?.admin?.style || {}),
  ...(field?.admin?.width
    ? {
        '--field-width': field.admin.width,
      }
    : {
        flex: '1 1 auto',
      }),
  // allow flex overrides to still take precedence over the fallback
  ...(field?.admin?.style?.flex
    ? {
        flex: field.admin.style.flex,
      }
    : {}),
})
