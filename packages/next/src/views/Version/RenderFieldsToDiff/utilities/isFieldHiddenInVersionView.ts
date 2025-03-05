import type { ClientField, Field } from 'payload'

import { fieldIsID, fieldIsPresentationalOnly } from 'payload/shared'

export function isFieldHiddenInVersionView(field: ClientField | Field) {
  // Presentational fields (like UI fields) are not supposed to appear in the
  // version view. This narrows the type of field to avoid type errors.
  if (fieldIsPresentationalOnly(field)) {
    return true
  }

  // Don't render id fields
  if (fieldIsID(field)) {
    return true
  }

  // Don't render hidden fields, because they are supposed to be hidden everywhere
  if (field.hidden) {
    return true
  }

  // Don't render fields with admin.disabled, because they are supposed to be
  // hidden everywhere in the admin UI.
  if (field.admin?.disabled) {
    return true
  }

  // Don't render fields with admin.hiddenInVersionView, because they are
  // supposed to be hidden specifically in the version view.
  if (field.admin?.hiddenInVersionView) {
    return true
  }

  return false
}
