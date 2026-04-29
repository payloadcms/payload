'use client'

export const handleMin3 = (value: unknown): string | true => {
  if (typeof value !== 'string' || value.length < 3) {
    return 'must be at least 3 characters'
  }
  return true
}
