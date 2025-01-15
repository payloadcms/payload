import { getTranslation, type I18n } from '@payloadcms/translations'

import type { LabelFunction, StaticLabel } from '../config/types.js'

export const getTranslatedLabel = (label: LabelFunction | StaticLabel, i18n?: I18n): string => {
  if (typeof label === 'function') {
    return label({ t: i18n.t })
  }

  if (typeof label === 'object') {
    return getTranslation(label, i18n)
  }

  return label
}
