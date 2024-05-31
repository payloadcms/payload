function s(t) {
  return (n = {}) => {
    let e = n.width ? String(n.width) : t.defaultWidth
    return t.formats[e] || t.formats[t.defaultWidth]
  }
}
function k(t) {
  return (n, e) => {
    let a = e?.context ? String(e.context) : 'standalone',
      r
    if (a === 'formatting' && t.formattingValues) {
      let l = t.defaultFormattingWidth || t.defaultWidth,
        u = e?.width ? String(e.width) : l
      r = t.formattingValues[u] || t.formattingValues[l]
    } else {
      let l = t.defaultWidth,
        u = e?.width ? String(e.width) : t.defaultWidth
      r = t.values[u] || t.values[l]
    }
    let c = t.argumentCallback ? t.argumentCallback(n) : n
    return r[c]
  }
}
function w(t) {
  return (n, e = {}) => {
    let a = n.match(t.matchPattern)
    if (!a) return null
    let r = a[0],
      c = n.match(t.parsePattern)
    if (!c) return null
    let l = t.valueCallback ? t.valueCallback(c[0]) : c[0]
    l = e.valueCallback ? e.valueCallback(l) : l
    let u = n.slice(r.length)
    return { value: l, rest: u }
  }
}
function C(t) {
  return (n, e = {}) => {
    let a = e.width,
      r = (a && t.matchPatterns[a]) || t.matchPatterns[t.defaultMatchWidth],
      c = n.match(r)
    if (!c) return null
    let l = c[0],
      u = (a && t.parsePatterns[a]) || t.parsePatterns[t.defaultParseWidth],
      h = Array.isArray(u) ? m(u, (i) => i.test(l)) : o(u, (i) => i.test(l)),
      d
    ;(d = t.valueCallback ? t.valueCallback(h) : h), (d = e.valueCallback ? e.valueCallback(d) : d)
    let f = n.slice(l.length)
    return { value: d, rest: f }
  }
}
function o(t, n) {
  for (let e in t) if (Object.prototype.hasOwnProperty.call(t, e) && n(t[e])) return e
}
function m(t, n) {
  for (let e = 0; e < t.length; e++) if (n(t[e])) return e
}
export { s as a, k as b, w as c, C as d }
