'use client'

/**
 * A field component that renders nothing.
 *
 * Use this when you need a field to exist in form state but don't want
 * any DOM element rendered (e.g., when another component handles the field UI).
 *
 * Unlike HiddenField which renders `<input type="hidden">`, NullField
 * produces no DOM output at all.
 */
export const NullField = (): null => null
