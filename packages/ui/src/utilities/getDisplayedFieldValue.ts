import type { I18nClient } from '@payloadcms/translations'
import type { ClientField } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

/**
 * Returns the appropriate display value for a field.
 * - For select and radio fields:
 *   - Returns JSX elements as-is.
 *   - Translates localized label objects based on the current language.
 *   - Returns string labels directly.
 *   - Falls back to the option value if no valid label is found.
 * - For all other field types, returns `cellData` unchanged.
 */
export const getDisplayedFieldValue = (cellData: any, field: ClientField, i18n: I18nClient) => {
  if ((field?.type === 'select' || field?.type === 'radio') && Array.isArray(field.options)) {
    const selectedOption = field.options.find((opt) =>
      typeof opt === 'object' ? opt.value === cellData : opt === cellData,
    )

    if (selectedOption) {
      if (typeof selectedOption === 'object' && 'label' in selectedOption) {
        return React.isValidElement(selectedOption.label)
          ? selectedOption.label // Return JSX directly
          : getTranslation(selectedOption.label, i18n) || selectedOption.value // Use translation or fallback to value
      }
      return selectedOption // If option is a string, return it directly
    }
  }
  return cellData // Default fallback if no match found
}
