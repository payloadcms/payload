import stylelint from 'stylelint'

const ruleName = 'plugin/no-subpixel-values'

const PIXEL_VALUE_PATTERN = /-?\d*\.\d+px/g

const LAYOUT_PROPERTIES = new Set([
  'bottom',
  'column-gap',
  'flex-basis',
  'gap',
  'height',
  'inset',
  'inset-block',
  'inset-block-end',
  'inset-block-start',
  'inset-inline',
  'inset-inline-end',
  'inset-inline-start',
  'left',
  'margin',
  'margin-block',
  'margin-block-end',
  'margin-block-start',
  'margin-bottom',
  'margin-inline',
  'margin-inline-end',
  'margin-inline-start',
  'margin-left',
  'margin-right',
  'margin-top',
  'max-height',
  'max-width',
  'min-height',
  'min-width',
  'padding',
  'padding-block',
  'padding-block-end',
  'padding-block-start',
  'padding-bottom',
  'padding-inline',
  'padding-inline-end',
  'padding-inline-start',
  'padding-left',
  'padding-right',
  'padding-top',
  'right',
  'row-gap',
  'top',
  'width',
])

const TYPOGRAPHY_PROPERTIES = new Set(['font-size', 'letter-spacing', 'line-height'])

const messages = stylelint.utils.ruleMessages(ruleName, {
  rejectedLayoutDecimal: (value, prop) =>
    `Unexpected decimal pixel value "${value}" on layout property "${prop}". Layout properties should generally be whole numbers unless explicitly justified.`,
  rejectedPrecision: (value) =>
    `Unexpected sub-pixel value "${value}". Pixel values may contain at most one decimal place.`,
})

const ruleFunction = (enabled) => {
  return (root, result) => {
    const validOptions = stylelint.utils.validateOptions(result, ruleName, {
      actual: enabled,
      possible: [true, false],
    })

    if (!validOptions || !enabled) {
      return
    }

    root.walkDecls((decl) => {
      const prop = decl.prop.toLowerCase()

      if (prop.startsWith('--') || TYPOGRAPHY_PROPERTIES.has(prop)) {
        return
      }

      const pixelValues = decl.value.match(PIXEL_VALUE_PATTERN)

      if (!pixelValues) {
        return
      }

      const isLayoutProperty = LAYOUT_PROPERTIES.has(prop)

      for (const pixelValue of pixelValues) {
        const decimalPlaces = pixelValue.split('.')[1].length - 'px'.length

        if (decimalPlaces > 1) {
          stylelint.utils.report({
            message: messages.rejectedPrecision(pixelValue),
            node: decl,
            result,
            ruleName,
            word: pixelValue,
          })
          continue
        }

        if (isLayoutProperty) {
          stylelint.utils.report({
            message: messages.rejectedLayoutDecimal(pixelValue, decl.prop),
            node: decl,
            result,
            ruleName,
            word: pixelValue,
          })
        }
      }
    })
  }
}

ruleFunction.ruleName = ruleName
ruleFunction.messages = messages

export default stylelint.createPlugin(ruleName, ruleFunction)
