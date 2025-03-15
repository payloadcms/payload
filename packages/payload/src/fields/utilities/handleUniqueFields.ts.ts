// Fields that can have unique values:
// Json - can append
// Code - can append
// Email - cant do anything, return undefined
// Number - can append with number + 1
// Point - cant do anything, return undefined
// Relationship - cant do anything, return undefined
// Select - cant do anything, return undefined
// Text - can append
// Textarea - can append
// Upload - cant do anything, return undefined

type updateOptions = 'append' | 'numericallyAppend' | 'undefined'

const updateStrategies: Record<updateOptions, Set<string>> = {
  append: new Set(['code', 'json', 'text', 'textarea']),
  numericallyAppend: new Set(['number']),
  undefined: new Set(['email', 'point', 'relationship', 'select', 'upload']),
}

export const handleUniqueFields = (fieldType: string): updateOptions => {
  if (updateStrategies.append.has(fieldType)) {
    return 'append'
  }
  if (updateStrategies.numericallyAppend.has(fieldType)) {
    return 'numericallyAppend'
  }
  return 'undefined'
}
