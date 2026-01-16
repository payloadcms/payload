/**
 * Process rich text fields to ensure proper data types for Lexical editor.
 * Lexical expects certain properties to be numbers, not strings.
 */
export const processRichTextField = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') {
    return value
  }

  // Properties that should be numbers in Lexical
  const numericProperties = [
    'detail',
    'format',
    'indent',
    'version',
    'value',
    'start',
    'textFormat',
    'textStyle',
  ]

  const processNode = (node: any): any => {
    if (!node || typeof node !== 'object') {
      return node
    }

    // Process current node's properties
    const processed: any = {}
    for (const [key, val] of Object.entries(node)) {
      if (numericProperties.includes(key) && typeof val === 'string') {
        // Convert string numbers to actual numbers
        const num = parseFloat(val)
        processed[key] = isNaN(num) ? val : num
      } else if (key === 'children' && Array.isArray(val)) {
        // Recursively process children
        processed[key] = val.map((child) => processNode(child))
      } else if (typeof val === 'object' && val !== null) {
        // Recursively process nested objects
        processed[key] = processNode(val)
      } else {
        processed[key] = val
      }
    }

    return processed
  }

  return processNode(value)
}
