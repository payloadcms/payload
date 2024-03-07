function isObject(o: unknown): boolean {
  return Object.prototype.toString.call(o) === '[object Object]'
}

export function isPlainObject(o: unknown): boolean {
  // Is this a React component?
  if (typeof o === 'object' && '$$typeof' in o && typeof o.$$typeof === 'symbol') {
    return false
  }

  if (isObject(o) === false) return false

  // If has modified constructor
  const ctor = o.constructor
  if (ctor === undefined) return true

  // If has modified prototype
  const prot = ctor.prototype
  if (isObject(prot) === false) return false

  // If constructor does not have an Object-specific method
  // eslint-disable-next-line no-prototype-builtins
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false
  }

  // Most likely a plain Object
  return true
}
