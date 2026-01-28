import { getTranslation, type I18n } from '@payloadcms/translations'

import type { LabelFunction, StaticLabel } from '../config/types.js'

export const getTranslatedLabel = (
  label: LabelFunction | StaticLabel | undefined,
  i18n?: I18n,
): string | undefined => {
  if (typeof label === 'function') {
    return label({ i18n: i18n!, t: i18n!.t })
  }

  if (typeof label === 'object') {
    return getTranslation(label, i18n!)
  }

  return label
}
