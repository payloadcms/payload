// @ts-no-check

/**
 * THIS FILE IS BASED ON:
 * https://github.com/rocicorp/fractional-indexing/blob/main/src/index.js
 *
 * MODIFIED FOR PAYLOAD CMS:
 * - Changed the integer part encoding to use only digits for "small" keys and
 *   only lowercase letters for "large" keys, ensuring consistent ordering
 *   across databases with different collations.
 *
 * - Original algorithm used A-Z (uppercase) for "smaller" integers and a-z (lowercase)
 *   for "larger" integers, relying on ASCII ordering where 'Z' < 'a'.
 *
 * - Some databases (e.g., PostgreSQL with default collation) use case-insensitive
 *   comparison, treating 'Z' as 'z', which breaks the ordering.
 *
 * - New encoding:
 *   - Uses digits '0'-'9' for "small" integers (10 values, lengths 11 down to 2)
 *   - Uses lowercase 'a'-'z' for "large" integers (26 values, lengths 2 up to 27)
 *   - Digits ALWAYS sort before letters in both ASCII and case-insensitive orderings.
 *
 * - Ordering: '0...' < '1...' < ... < '9..' < 'a.' < 'b..' < ... < 'z...'
 *
 * BACKWARD COMPATIBILITY:
 * - Existing keys starting with lowercase 'a'-'z' remain valid and work correctly.
 * - Keys starting with uppercase 'A'-'Z' (from the old algorithm) will still be
 *   parsed for backward compatibility, but they may sort incorrectly in
 *   case-insensitive databases. Consider running a migration to convert them.
 */

// License: CC0 (no rights reserved).

// This is based on https://observablehq.com/@dgreensp/implementing-fractional-indexing

export const BASE_36_DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'

// `a` may be empty string, `b` is null or non-empty string.
// `a < b` lexicographically if `b` is non-null.
// no trailing zeros allowed.
// digits is a string such as '0123456789' for base 10.  Digits must be in
// ascending character code order!
/**
 * @param {string} a
 * @param {string | null | undefined} b
 * @param {string} digits
 * @returns {string}
 */
function midpoint(a, b, digits) {
  const zero = digits[0]
  if (b != null && a >= b) {
    throw new Error(a + ' >= ' + b)
  }
  if (a.slice(-1) === zero || (b && b.slice(-1) === zero)) {
    throw new Error('trailing zero')
  }
  if (b) {
    // remove longest common prefix.  pad `a` with 0s as we
    // go.  note that we don't need to pad `b`, because it can't
    // end before `a` while traversing the common prefix.
    let n = 0
    while ((a[n] || zero) === b[n]) {
      n++
    }
    if (n > 0) {
      return b.slice(0, n) + midpoint(a.slice(n), b.slice(n), digits)
    }
  }
  // first digits (or lack of digit) are different
  const digitA = a ? digits.indexOf(a[0]) : 0
  const digitB = b != null ? digits.indexOf(b[0]) : digits.length
  if (digitB - digitA > 1) {
    const midDigit = Math.round(0.5 * (digitA + digitB))
    return digits[midDigit]
  } else {
    // first digits are consecutive
    if (b && b.length > 1) {
      return b.slice(0, 1)
    } else {
      // `b` is null or has length 1 (a single digit).
      // the first digit of `a` is the previous digit to `b`,
      // or 9 if `b` is null.
      // given, for example, midpoint('49', '5'), return
      // '4' + midpoint('9', null), which will become
      // '4' + '9' + midpoint('', null), which is '495'
      return digits[digitA] + midpoint(a.slice(1), null, digits)
    }
  }
}

/**
 * @param {string} int
 * @return {void}
 */

function validateInteger(int) {
  if (int.length !== getIntegerLength(int[0])) {
    throw new Error('invalid integer part of order key: ' + int)
  }
}

/**
 * Returns the length of the integer part based on the head character.
 *
 * New encoding (case-insensitive safe):
 * - SMALL range (digits): '0' = 11 chars, '1' = 10 chars, ..., '9' = 2 chars
 * - LARGE range (lowercase): 'a' = 2 chars, 'b' = 3 chars, ..., 'z' = 27 chars
 *
 * Legacy encoding (for backward compatibility with existing keys):
 * - 'A'-'Z' uppercase: 'A' = 27 chars, 'B' = 26 chars, ..., 'Z' = 2 chars
 *
 * @param {string} head
 * @return {number}
 */
function getIntegerLength(head) {
  if (head >= '0' && head <= '9') {
    return 11 - (head.charCodeAt(0) - '0'.charCodeAt(0))
  } else if (head >= 'a' && head <= 'z') {
    return head.charCodeAt(0) - 'a'.charCodeAt(0) + 2
  } else if (head >= 'A' && head <= 'Z') {
    // Legacy encoding
    return 'Z'.charCodeAt(0) - head.charCodeAt(0) + 2
  } else {
    throw new Error('invalid order key head: ' + head)
  }
}

/**
 * @param {string} key
 * @return {string}
 */

function getIntegerPart(key) {
  const integerPartLength = getIntegerLength(key[0])
  if (integerPartLength > key.length) {
    throw new Error('invalid order key: ' + key)
  }
  return key.slice(0, integerPartLength)
}

/**
 * Smallest possible key (for validation)
 * '0' + 10 zeros = smallest valid key in new format
 */
const SMALLEST_KEY = '0' + BASE_36_DIGITS[0].repeat(10)

/**
 * @param {string} key
 * @param {string} digits
 * @return {void}
 */

function validateOrderKey(key, digits) {
  if (key === SMALLEST_KEY) {
    throw new Error('invalid order key: ' + key)
  }
  // Legacy check for old format
  if (key === 'A' + digits[0].repeat(26)) {
    throw new Error('invalid order key: ' + key)
  }
  // getIntegerPart will throw if the first character is bad,
  // or the key is too short.  we'd call it to check these things
  // even if we didn't need the result
  const i = getIntegerPart(key)
  const f = key.slice(i.length)
  if (f.slice(-1) === digits[0]) {
    throw new Error('invalid order key: ' + key)
  }
}

// note that this may return null, as there is a largest integer
/**
 * @param {string} x
 * @param {string} digits
 * @return {string | null}
 */
function incrementInteger(x, digits) {
  validateInteger(x)
  const [head, ...digs] = x.split('')
  let carry = true
  for (let i = digs.length - 1; carry && i >= 0; i--) {
    const d = digits.indexOf(digs[i]) + 1
    if (d === digits.length) {
      digs[i] = digits[0]
    } else {
      digs[i] = digits[d]
      carry = false
    }
  }
  if (carry) {
    if (head === '9') {
      return 'a' + digits[0]
    }
    // Handle legacy uppercase transition
    if (head === 'Z') {
      return 'a' + digits[0]
    }
    if (head === 'z') {
      return null
    }

    let h
    if (head >= '0' && head <= '8') {
      h = String.fromCharCode(head.charCodeAt(0) + 1)
      digs.pop()
    } else if (head >= 'a' && head <= 'y') {
      h = String.fromCharCode(head.charCodeAt(0) + 1)
      digs.push(digits[0])
    } else if (head >= 'A' && head <= 'Y') {
      // Legacy uppercase
      h = String.fromCharCode(head.charCodeAt(0) + 1)
      digs.pop()
    } else {
      throw new Error('invalid head: ' + head)
    }
    return h + digs.join('')
  } else {
    return head + digs.join('')
  }
}

// note that this may return null, as there is a smallest integer
/**
 * @param {string} x
 * @param {string} digits
 * @return {string | null}
 */

function decrementInteger(x, digits) {
  validateInteger(x)
  const [head, ...digs] = x.split('')
  let borrow = true
  for (let i = digs.length - 1; borrow && i >= 0; i--) {
    const d = digits.indexOf(digs[i]) - 1
    if (d === -1) {
      digs[i] = digits.slice(-1)
    } else {
      digs[i] = digits[d]
      borrow = false
    }
  }
  if (borrow) {
    if (head === 'a') {
      return '9' + digits.slice(-1)
    }
    if (head === '0') {
      return null
    }

    let h
    if (head >= '1' && head <= '9') {
      h = String.fromCharCode(head.charCodeAt(0) - 1)
      digs.push(digits.slice(-1))
    } else if (head >= 'b' && head <= 'z') {
      h = String.fromCharCode(head.charCodeAt(0) - 1)
      digs.pop()
    } else if (head >= 'B' && head <= 'Z') {
      // Legacy uppercase
      h = String.fromCharCode(head.charCodeAt(0) - 1)
      digs.push(digits.slice(-1))
    } else if (head === 'A') {
      // Legacy uppercase
      return null
    } else {
      throw new Error('invalid head: ' + head)
    }
    return h + digs.join('')
  } else {
    return head + digs.join('')
  }
}

// `a` is an order key or null (START).
// `b` is an order key or null (END).
// `a < b` lexicographically if both are non-null.
// digits is a string such as '0123456789' for base 10.  Digits must be in
// ascending character code order!
/**
 * @param {string | null | undefined} a
 * @param {string | null | undefined} b
 * @param {string=} digits
 * @return {string}
 */
export function generateKeyBetween(a, b, digits = BASE_36_DIGITS) {
  if (a != null) {
    validateOrderKey(a, digits)
  }
  if (b != null) {
    validateOrderKey(b, digits)
  }
  if (a != null && b != null && a >= b) {
    throw new Error(a + ' >= ' + b)
  }
  if (a == null) {
    if (b == null) {
      return 'a' + digits[0]
    }

    const ib = getIntegerPart(b)
    const fb = b.slice(ib.length)
    if (ib === SMALLEST_KEY) {
      return ib + midpoint('', fb, digits)
    }
    // Legacy check
    if (ib === 'A' + digits[0].repeat(26)) {
      return ib + midpoint('', fb, digits)
    }
    if (ib < b) {
      return ib
    }
    const res = decrementInteger(ib, digits)
    if (res == null) {
      throw new Error('cannot decrement any more')
    }
    return res
  }

  if (b == null) {
    const ia = getIntegerPart(a)
    const fa = a.slice(ia.length)
    const i = incrementInteger(ia, digits)
    return i == null ? ia + midpoint(fa, null, digits) : i
  }

  const ia = getIntegerPart(a)
  const fa = a.slice(ia.length)
  const ib = getIntegerPart(b)
  const fb = b.slice(ib.length)
  if (ia === ib) {
    return ia + midpoint(fa, fb, digits)
  }
  const i = incrementInteger(ia, digits)
  if (i == null) {
    throw new Error('cannot increment any more')
  }
  if (i < b) {
    return i
  }
  return ia + midpoint(fa, null, digits)
}

/**
 * same preconditions as generateKeysBetween.
 * n >= 0.
 * Returns an array of n distinct keys in sorted order.
 * If a and b are both null, returns [a0, a1, ...]
 * If one or the other is null, returns consecutive "integer"
 * keys.  Otherwise, returns relatively short keys between
 * a and b.
 * @param {string | null | undefined} a
 * @param {string | null | undefined} b
 * @param {number} n
 * @param {string} digits
 * @return {string[]}
 */
export function generateNKeysBetween(a, b, n, digits = BASE_36_DIGITS) {
  if (n === 0) {
    return []
  }
  if (n === 1) {
    return [generateKeyBetween(a, b, digits)]
  }
  if (b == null) {
    let c = generateKeyBetween(a, b, digits)
    const result = [c]
    for (let i = 0; i < n - 1; i++) {
      c = generateKeyBetween(c, b, digits)
      result.push(c)
    }
    return result
  }
  if (a == null) {
    let c = generateKeyBetween(a, b, digits)
    const result = [c]
    for (let i = 0; i < n - 1; i++) {
      c = generateKeyBetween(a, c, digits)
      result.push(c)
    }
    result.reverse()
    return result
  }
  const mid = Math.floor(n / 2)
  const c = generateKeyBetween(a, b, digits)
  return [
    ...generateNKeysBetween(a, c, mid, digits),
    c,
    ...generateNKeysBetween(c, b, n - mid - 1, digits),
  ]
}
