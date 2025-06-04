import React from 'react'

/**
 * Extracts plain text content from a React node by recursively traversing its structure.
 *
 * For server components and static analysis.
 */
export const extractTextFromReactNode = (node: React.ReactNode): string => {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return ''
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return node.toString()
  }

  if (Array.isArray(node)) {
    return node.map(extractTextFromReactNode).join('')
  }

  if (React.isValidElement(node)) {
    const textParts: string[] = []

    for (const [key, value] of Object.entries(node.props)) {
      // Only recurse into props that might contain React content
      if (
        key === 'children' ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        React.isValidElement(value) ||
        Array.isArray(value)
      ) {
        textParts.push(extractTextFromReactNode(value))
      }
    }

    return textParts.join('')
  }

  return ''
}
