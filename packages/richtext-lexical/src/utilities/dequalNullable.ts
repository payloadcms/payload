/**
 * Based on dequal/lite by Luke Edwards (lukeed)
 * https://github.com/lukeed/dequal
 * MIT License - Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com)
 *
 * Modified to treat null, undefined, and missing keys as equivalent.
 * This prevents false positives when the server injects explicit nulls
 * for empty sub-fields that the editor's toJSON() simply omits.
 */

const has = Object.prototype.hasOwnProperty

export function dequalNullable(foo: unknown, bar: unknown): boolean {
  let ctor: any, len: any

  if (foo === bar) {
    return true
  }

  // CHANGED: treat null/undefined/missing as equivalent
  if (isNullish(foo) && isNullish(bar)) {
    return true
  }

  if (foo && bar && (ctor = (foo as any).constructor) === (bar as any).constructor) {
    if (ctor === Date) {
      return (foo as Date).getTime() === (bar as Date).getTime()
    }
    if (ctor === RegExp) {
      return (foo as RegExp).toString() === (bar as RegExp).toString()
    }

    if (ctor === Array) {
      if ((len = (foo as any[]).length) === (bar as any[]).length) {
        // eslint-disable-next-line no-empty
        while (len-- && dequalNullable((foo as any[])[len], (bar as any[])[len])) {}
      }
      return len === -1
    }

    if (!ctor || typeof foo === 'object') {
      len = 0
      for (ctor in foo as Record<string, unknown>) {
        // CHANGED: skip nullish values in foo instead of requiring them in bar
        if (
          has.call(foo, ctor) &&
          !isNullish((foo as any)[ctor]) &&
          ++len &&
          !has.call(bar, ctor)
        ) {
          return false
        }
        if (!(ctor in (bar as any)) || !dequalNullable((foo as any)[ctor], (bar as any)[ctor])) {
          // CHANGED: missing key in bar is ok if foo's value is nullish
          if (isNullish((foo as any)[ctor])) {
            len-- // undo the count since we're skipping this key
            continue
          }
          return false
        }
      }
      // CHANGED: only count non-nullish keys in bar for the length check
      return countNonNullishKeys(bar as Record<string, unknown>) === len
    }
  }

  return foo !== foo && bar !== bar
}

function isNullish(v: unknown): boolean {
  return v === null || v === undefined
}

function countNonNullishKeys(obj: Record<string, unknown>): number {
  let count = 0
  for (const key in obj) {
    if (has.call(obj, key) && !isNullish(obj[key])) {
      count++
    }
  }
  return count
}
