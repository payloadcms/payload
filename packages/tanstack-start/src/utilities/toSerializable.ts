import type { Serializable, SerializableExtensions } from '@tanstack/react-router'

/** A record with trusted RSC additions for TanStack's server-function transport. */
export type SerializableRecord = Record<string, unknown> & SerializableExtensions['TsrSerializable']

/**
 * Adds RSC handles to an otherwise Seroval-compatible layout payload.
 */
export function toSerializable<T>(value: T): T
export function toSerializable(
  value: Record<string, unknown>,
  additions: Record<string, Serializable>,
): SerializableRecord
export function toSerializable(value: unknown, additions?: Record<string, Serializable>): unknown {
  if (additions) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new TypeError('Serializable additions require an object source')
    }

    const result = { ...value, ...additions } satisfies Record<string, unknown>

    return result as SerializableRecord
  }

  return value
}
