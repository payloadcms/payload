function a(t) {
  let e = Object.prototype.toString.call(t)
  return t instanceof Date || (typeof t == 'object' && e === '[object Date]')
    ? new t.constructor(+t)
    : typeof t == 'number' ||
        e === '[object Number]' ||
        typeof t == 'string' ||
        e === '[object String]'
      ? new Date(t)
      : new Date(NaN)
}
var i = {}
function f() {
  return i
}
function O(t, e) {
  let n = f(),
    r =
      e?.weekStartsOn ??
      e?.locale?.options?.weekStartsOn ??
      n.weekStartsOn ??
      n.locale?.options?.weekStartsOn ??
      0,
    o = a(t),
    s = o.getDay(),
    c = (s < r ? 7 : 0) + s - r
  return o.setDate(o.getDate() - c), o.setHours(0, 0, 0, 0), o
}
export { a, f as b, O as c }
