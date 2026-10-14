import type { Serializable, SerializableExtensions } from '@tanstack/react-router'

import { stripUnserializable } from './stripUnserializable.js'

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
  const serialized = stripUnserializable(value)

  if (additions) {
    if (typeof serialized !== 'object' || serialized === null || Array.isArray(serialized)) {
      throw new TypeError('Serializable additions require an object source')
    }

    const result = { ...serialized, ...additions } satisfies Record<string, unknown>

    return result as SerializableRecord
  }

  return serialized
}
