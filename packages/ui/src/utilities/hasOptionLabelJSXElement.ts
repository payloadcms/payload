import type { DefaultCellComponentProps, OptionLabel } from 'payload'

import React from 'react'

export const hasOptionLabelJSXElement = (cellClientProps: DefaultCellComponentProps) => {
  const { cellData, field } = cellClientProps

  if ((field?.type === 'select' || field?.type == 'radio') && Array.isArray(field?.options)) {
    const matchingOption = field.options.find(
      (option) => typeof option === 'object' && option.value === cellData,
    )

    if (
      matchingOption &&
      typeof matchingOption === 'object' &&
      React.isValidElement(matchingOption.label)
    ) {
      return true
    }
  }

  return false
}

export const isJSXElement = (value: OptionLabel): boolean => {
  return value && typeof value === 'object' && '$$typeof' in value
}
