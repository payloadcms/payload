import React from 'react'

/**
 * Extracts plain text content from a React node by traversing its structure.
 * Use cases:
 *   - Make React elements (field labels) searchable in filter dropdowns
 *   - Etc.
 */
export const extractTextFromReactNode = (reactNode: React.ReactNode): string => {
  if (reactNode === null || reactNode === undefined || reactNode === false) {
    return ''
  }

  if (typeof reactNode === 'string' || typeof reactNode === 'number') {
    return reactNode.toString()
  }

  if (Array.isArray(reactNode)) {
    return reactNode.map(extractTextFromReactNode).join('')
  }

  if (React.isValidElement(reactNode)) {
    const { children } = reactNode.props as Record<string, React.ReactNode>
    return extractTextFromReactNode(children)
  }

  // Handle other cases (e.g., symbols, functions) explicitly if needed
  return ''
}
