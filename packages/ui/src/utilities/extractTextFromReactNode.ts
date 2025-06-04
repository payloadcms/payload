import React from 'react'

/**
 * Extracts plain text content from a React node by traversing its structure.
 * Use cases:
 *   - Make React elements (field labels) searchable in filter dropdowns
 */
export const extractTextFromReactNode = (reactNode: React.ReactNode): string => {
  if (reactNode === null || reactNode === undefined || typeof reactNode === 'boolean') {
    return ''
  }

  if (typeof reactNode === 'string' || typeof reactNode === 'number') {
    return reactNode.toString()
  }

  if (Array.isArray(reactNode)) {
    return reactNode.map(extractTextFromReactNode).join('')
  }

  if (React.isValidElement(reactNode)) {
    const textParts: string[] = []

    for (const [key, value] of Object.entries(reactNode.props)) {
      // Only recurse into props that might contain React content
      if (
        key === 'children' ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        React.isValidElement(value) ||
        Array.isArray(value)
      ) {
        textParts.push(extractTextFromReactNode(reactNode))
      }
    }

    return textParts.join('')
  }

  return ''
}
