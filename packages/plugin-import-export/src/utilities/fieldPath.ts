const unsupportedFieldPathSegments = new Set(['__proto__', 'constructor', 'prototype'])

export const hasUnsupportedFieldPathSegment = (segments: string[]): boolean =>
  segments.some((segment) => unsupportedFieldPathSegments.has(segment))
