import type { DefaultCellComponentProps } from '@ruya.sa/payload'

import { isValidReactElement } from './isValidReactElement.js'

export const hasOptionLabelJSXElement = (cellClientProps: DefaultCellComponentProps) => {
  const { cellData, field } = cellClientProps

  if ((field?.type === 'select' || field?.type == 'radio') && Array.isArray(field?.options)) {
    const matchingOption = field.options.find(
      (option) => typeof option === 'object' && option.value === cellData,
    )

    if (
      matchingOption &&
      typeof matchingOption === 'object' &&
      isValidReactElement(matchingOption.label)
    ) {
      return true
    }
  }

  return false
}
