import { b as dn } from './chunk-FQU34KAG.js'
import { a as He, b as Ke, c as C, e as jo } from './chunk-DGJUBN33.js'
var pn = C((Ot) => {
  'use strict'
  Ot._ = Ot._interop_require_default = ko
  function ko(e) {
    return e && e.__esModule ? e : { default: e }
  }
})
var vn = C((Pt) => {
  'use client'
  'use strict'
  Object.defineProperty(Pt, '__esModule', { value: !0 })
  function Do(e, t) {
    for (var n in t) Object.defineProperty(e, n, { enumerable: !0, get: t[n] })
  }
  Do(Pt, {
    AppRouterContext: function () {
      return gn
    },
    GlobalLayoutRouterContext: function () {
      return yn
    },
    LayoutRouterContext: function () {
      return mn
    },
    MissingSlotContext: function () {
      return Fo
    },
    TemplateContext: function () {
      return hn
    },
  })
  var No = pn(),
    Ie = No._(He('react')),
    gn = Ie.default.createContext(null),
    mn = Ie.default.createContext(null),
    yn = Ie.default.createContext(null),
    hn = Ie.default.createContext(null)
  process.env.NODE_ENV !== 'production' &&
    ((gn.displayName = 'AppRouterContext'),
    (mn.displayName = 'LayoutRouterContext'),
    (yn.displayName = 'GlobalLayoutRouterContext'),
    (hn.displayName = 'TemplateContext'))
  var Fo = Ie.default.createContext(new Set())
})
var Tn = C((Rt) => {
  'use client'
  'use strict'
  Object.defineProperty(Rt, '__esModule', { value: !0 })
  function Io(e, t) {
    for (var n in t) Object.defineProperty(e, n, { enumerable: !0, get: t[n] })
  }
  Io(Rt, {
    PathParamsContext: function () {
      return wn
    },
    PathnameContext: function () {
      return xn
    },
    SearchParamsContext: function () {
      return bn
    },
  })
  var Ct = He('react'),
    bn = (0, Ct.createContext)(null),
    xn = (0, Ct.createContext)(null),
    wn = (0, Ct.createContext)(null)
  process.env.NODE_ENV !== 'production' &&
    ((bn.displayName = 'SearchParamsContext'),
    (xn.displayName = 'PathnameContext'),
    (wn.displayName = 'PathParamsContext'))
})
var Sn = C((te, _n) => {
  'use strict'
  Object.defineProperty(te, '__esModule', { value: !0 })
  Object.defineProperty(te, 'getSegmentValue', {
    enumerable: !0,
    get: function () {
      return qo
    },
  })
  function qo(e) {
    return Array.isArray(e) ? e[1] : e
  }
  ;(typeof te.default == 'function' || (typeof te.default == 'object' && te.default !== null)) &&
    typeof te.default.__esModule > 'u' &&
    (Object.defineProperty(te.default, '__esModule', { value: !0 }),
    Object.assign(te.default, te),
    (_n.exports = te.default))
})
var En = C((At) => {
  'use strict'
  Object.defineProperty(At, '__esModule', { value: !0 })
  function $o(e, t) {
    for (var n in t) Object.defineProperty(e, n, { enumerable: !0, get: t[n] })
  }
  $o(At, {
    DEFAULT_SEGMENT_KEY: function () {
      return Wo
    },
    PAGE_SEGMENT_KEY: function () {
      return Bo
    },
    isGroupSegment: function () {
      return Uo
    },
  })
  function Uo(e) {
    return e[0] === '(' && e.endsWith(')')
  }
  var Bo = '__PAGE__',
    Wo = '__DEFAULT__'
})
var Xe = C((ne, Pn) => {
  'use strict'
  Object.defineProperty(ne, '__esModule', { value: !0 })
  Object.defineProperty(ne, 'createAsyncLocalStorage', {
    enumerable: !0,
    get: function () {
      return Vo
    },
  })
  var Ge = new Error('Invariant: AsyncLocalStorage accessed in runtime where it is not available'),
    Lt = class {
      disable() {
        throw Ge
      }
      getStore() {}
      run() {
        throw Ge
      }
      exit() {
        throw Ge
      }
      enterWith() {
        throw Ge
      }
    },
    On = globalThis.AsyncLocalStorage
  function Vo() {
    return On ? new On() : new Lt()
  }
  ;(typeof ne.default == 'function' || (typeof ne.default == 'object' && ne.default !== null)) &&
    typeof ne.default.__esModule > 'u' &&
    (Object.defineProperty(ne.default, '__esModule', { value: !0 }),
    Object.assign(ne.default, ne),
    (Pn.exports = ne.default))
})
var Rn = C((re, Cn) => {
  'use strict'
  Object.defineProperty(re, '__esModule', { value: !0 })
  Object.defineProperty(re, 'requestAsyncStorage', {
    enumerable: !0,
    get: function () {
      return zo
    },
  })
  var Yo = Xe(),
    zo = (0, Yo.createAsyncLocalStorage)()
  ;(typeof re.default == 'function' || (typeof re.default == 'object' && re.default !== null)) &&
    typeof re.default.__esModule > 'u' &&
    (Object.defineProperty(re.default, '__esModule', { value: !0 }),
    Object.assign(re.default, re),
    (Cn.exports = re.default))
})
var Mn = C((oe, Ln) => {
  'use strict'
  Object.defineProperty(oe, '__esModule', { value: !0 })
  function Ho(e, t) {
    for (var n in t) Object.defineProperty(e, n, { enumerable: !0, get: t[n] })
  }
  Ho(oe, {
    getExpectedRequestStore: function () {
      return Ko
    },
    requestAsyncStorage: function () {
      return An.requestAsyncStorage
    },
  })
  var An = Rn()
  function Ko(e) {
    let t = An.requestAsyncStorage.getStore()
    if (t) return t
    throw new Error(
      '`' +
        e +
        '` was called outside a request scope. Read more: https://nextjs.org/docs/messages/next-dynamic-api-wrong-context',
    )
  }
  ;(typeof oe.default == 'function' || (typeof oe.default == 'object' && oe.default !== null)) &&
    typeof oe.default.__esModule > 'u' &&
    (Object.defineProperty(oe.default, '__esModule', { value: !0 }),
    Object.assign(oe.default, oe),
    (Ln.exports = oe.default))
})
var kn = C((ie, jn) => {
  'use strict'
  Object.defineProperty(ie, '__esModule', { value: !0 })
  Object.defineProperty(ie, 'actionAsyncStorage', {
    enumerable: !0,
    get: function () {
      return Xo
    },
  })
  var Go = Xe(),
    Xo = (0, Go.createAsyncLocalStorage)()
  ;(typeof ie.default == 'function' || (typeof ie.default == 'object' && ie.default !== null)) &&
    typeof ie.default.__esModule > 'u' &&
    (Object.defineProperty(ie.default, '__esModule', { value: !0 }),
    Object.assign(ie.default, ie),
    (jn.exports = ie.default))
})
var Nn = C((ae, Dn) => {
  'use strict'
  Object.defineProperty(ae, '__esModule', { value: !0 })
  Object.defineProperty(ae, 'actionAsyncStorage', {
    enumerable: !0,
    get: function () {
      return Jo.actionAsyncStorage
    },
  })
  var Jo = kn()
  ;(typeof ae.default == 'function' || (typeof ae.default == 'object' && ae.default !== null)) &&
    typeof ae.default.__esModule > 'u' &&
    (Object.defineProperty(ae.default, '__esModule', { value: !0 }),
    Object.assign(ae.default, ae),
    (Dn.exports = ae.default))
})
var In = C((se, Fn) => {
  'use strict'
  Object.defineProperty(se, '__esModule', { value: !0 })
  Object.defineProperty(se, 'RedirectStatusCode', {
    enumerable: !0,
    get: function () {
      return Mt
    },
  })
  var Mt
  ;(function (e) {
    ;(e[(e.SeeOther = 303)] = 'SeeOther'),
      (e[(e.TemporaryRedirect = 307)] = 'TemporaryRedirect'),
      (e[(e.PermanentRedirect = 308)] = 'PermanentRedirect')
  })(Mt || (Mt = {}))
  ;(typeof se.default == 'function' || (typeof se.default == 'object' && se.default !== null)) &&
    typeof se.default.__esModule > 'u' &&
    (Object.defineProperty(se.default, '__esModule', { value: !0 }),
    Object.assign(se.default, se),
    (Fn.exports = se.default))
})
var Qe = C((ce, $n) => {
  'use strict'
  Object.defineProperty(ce, '__esModule', { value: !0 })
  function Qo(e, t) {
    for (var n in t) Object.defineProperty(e, n, { enumerable: !0, get: t[n] })
  }
  Qo(ce, {
    RedirectType: function () {
      return kt
    },
    getRedirectError: function () {
      return Dt
    },
    getRedirectStatusCodeFromError: function () {
      return oi
    },
    getRedirectTypeFromError: function () {
      return ri
    },
    getURLFromRedirectError: function () {
      return ni
    },
    isRedirectError: function () {
      return Je
    },
    permanentRedirect: function () {
      return ti
    },
    redirect: function () {
      return ei
    },
  })
  var Zo = Mn(),
    qn = Nn(),
    Le = In(),
    jt = 'NEXT_REDIRECT',
    kt
  ;(function (e) {
    ;(e.push = 'push'), (e.replace = 'replace')
  })(kt || (kt = {}))
  function Dt(e, t, n) {
    n === void 0 && (n = Le.RedirectStatusCode.TemporaryRedirect)
    let r = new Error(jt)
    r.digest = jt + ';' + t + ';' + e + ';' + n + ';'
    let o = Zo.requestAsyncStorage.getStore()
    return o && (r.mutableCookies = o.mutableCookies), r
  }
  function ei(e, t) {
    t === void 0 && (t = 'replace')
    let n = qn.actionAsyncStorage.getStore()
    throw Dt(
      e,
      t,
      n?.isAction ? Le.RedirectStatusCode.SeeOther : Le.RedirectStatusCode.TemporaryRedirect,
    )
  }
  function ti(e, t) {
    t === void 0 && (t = 'replace')
    let n = qn.actionAsyncStorage.getStore()
    throw Dt(
      e,
      t,
      n?.isAction ? Le.RedirectStatusCode.SeeOther : Le.RedirectStatusCode.PermanentRedirect,
    )
  }
  function Je(e) {
    if (typeof e != 'object' || e === null || !('digest' in e) || typeof e.digest != 'string')
      return !1
    let t = e.digest.split(';'),
      [n, r] = t,
      o = t.slice(2, -2).join(';'),
      i = t.at(-2),
      a = Number(i)
    return (
      n === jt &&
      (r === 'replace' || r === 'push') &&
      typeof o == 'string' &&
      !isNaN(a) &&
      a in Le.RedirectStatusCode
    )
  }
  function ni(e) {
    return Je(e) ? e.digest.split(';').slice(2, -2).join(';') : null
  }
  function ri(e) {
    if (!Je(e)) throw new Error('Not a redirect error')
    return e.digest.split(';', 2)[1]
  }
  function oi(e) {
    if (!Je(e)) throw new Error('Not a redirect error')
    return Number(e.digest.split(';').at(-2))
  }
  ;(typeof ce.default == 'function' || (typeof ce.default == 'object' && ce.default !== null)) &&
    typeof ce.default.__esModule > 'u' &&
    (Object.defineProperty(ce.default, '__esModule', { value: !0 }),
    Object.assign(ce.default, ce),
    ($n.exports = ce.default))
})
var Ze = C((le, Un) => {
  'use strict'
  Object.defineProperty(le, '__esModule', { value: !0 })
  function ii(e, t) {
    for (var n in t) Object.defineProperty(e, n, { enumerable: !0, get: t[n] })
  }
  ii(le, {
    isNotFoundError: function () {
      return si
    },
    notFound: function () {
      return ai
    },
  })
  var Nt = 'NEXT_NOT_FOUND'
  function ai() {
    let e = new Error(Nt)
    throw ((e.digest = Nt), e)
  }
  function si(e) {
    return typeof e != 'object' || e === null || !('digest' in e) ? !1 : e.digest === Nt
  }
  ;(typeof le.default == 'function' || (typeof le.default == 'object' && le.default !== null)) &&
    typeof le.default.__esModule > 'u' &&
    (Object.defineProperty(le.default, '__esModule', { value: !0 }),
    Object.assign(le.default, le),
    (Un.exports = le.default))
})
var Vn = C((ue, Wn) => {
  'use strict'
  Object.defineProperty(ue, '__esModule', { value: !0 })
  function ci(e, t) {
    for (var n in t) Object.defineProperty(e, n, { enumerable: !0, get: t[n] })
  }
  ci(ue, {
    DynamicServerError: function () {
      return Ft
    },
    isDynamicServerError: function () {
      return li
    },
  })
  var Bn = 'DYNAMIC_SERVER_USAGE',
    Ft = class extends Error {
      constructor(t) {
        super('Dynamic server usage: ' + t), (this.description = t), (this.digest = Bn)
      }
    }
  function li(e) {
    return typeof e != 'object' || e === null || !('digest' in e) || typeof e.digest != 'string'
      ? !1
      : e.digest === Bn
  }
  ;(typeof ue.default == 'function' || (typeof ue.default == 'object' && ue.default !== null)) &&
    typeof ue.default.__esModule > 'u' &&
    (Object.defineProperty(ue.default, '__esModule', { value: !0 }),
    Object.assign(ue.default, ue),
    (Wn.exports = ue.default))
})
var et = C((qt) => {
  'use strict'
  Object.defineProperty(qt, '__esModule', { value: !0 })
  function ui(e, t) {
    for (var n in t) Object.defineProperty(e, n, { enumerable: !0, get: t[n] })
  }
  ui(qt, {
    BailoutToCSRError: function () {
      return It
    },
    isBailoutToCSRError: function () {
      return fi
    },
  })
  var Yn = 'BAILOUT_TO_CLIENT_SIDE_RENDERING',
    It = class extends Error {
      constructor(t) {
        super('Bail out to client-side rendering: ' + t), (this.reason = t), (this.digest = Yn)
      }
    }
  function fi(e) {
    return typeof e != 'object' || e === null || !('digest' in e) ? !1 : e.digest === Yn
  }
})
var zn = C(($t) => {
  'use strict'
  Object.defineProperty($t, '__esModule', { value: !0 })
  Object.defineProperty($t, 'isNavigationSignalError', {
    enumerable: !0,
    get: function () {
      return gi
    },
  })
  var di = Ze(),
    pi = Qe(),
    gi = (e) => (0, di.isNotFoundError)(e) || (0, pi.isRedirectError)(e)
})
var Hn = C((Ut) => {
  'use strict'
  Object.defineProperty(Ut, '__esModule', { value: !0 })
  Object.defineProperty(Ut, 'isDynamicUsageError', {
    enumerable: !0,
    get: function () {
      return vi
    },
  })
  var mi = Vn(),
    yi = et(),
    hi = zn(),
    vi = (e) =>
      (0, mi.isDynamicServerError)(e) ||
      (0, yi.isBailoutToCSRError)(e) ||
      (0, hi.isNavigationSignalError)(e)
})
var Kn = C((Bt) => {
  'use strict'
  Object.defineProperty(Bt, '__esModule', { value: !0 })
  Object.defineProperty(Bt, 'isPostpone', {
    enumerable: !0,
    get: function () {
      return xi
    },
  })
  var bi = Symbol.for('react.postpone')
  function xi(e) {
    return typeof e == 'object' && e !== null && e.$$typeof === bi
  }
})
var Xn = C((fe, Gn) => {
  'use strict'
  Object.defineProperty(fe, '__esModule', { value: !0 })
  Object.defineProperty(fe, 'isNextRouterError', {
    enumerable: !0,
    get: function () {
      return _i
    },
  })
  var wi = Ze(),
    Ti = Qe()
  function _i(e) {
    return e && e.digest && ((0, Ti.isRedirectError)(e) || (0, wi.isNotFoundError)(e))
  }
  ;(typeof fe.default == 'function' || (typeof fe.default == 'object' && fe.default !== null)) &&
    typeof fe.default.__esModule > 'u' &&
    (Object.defineProperty(fe.default, '__esModule', { value: !0 }),
    Object.assign(fe.default, fe),
    (Gn.exports = fe.default))
})
var Zn = C((de, Qn) => {
  'use strict'
  Object.defineProperty(de, '__esModule', { value: !0 })
  Object.defineProperty(de, 'unstable_rethrow', {
    enumerable: !0,
    get: function () {
      return Jn
    },
  })
  var Si = Hn(),
    Ei = Kn(),
    Oi = et(),
    Pi = Xn()
  function Jn(e) {
    if (
      (0, Pi.isNextRouterError)(e) ||
      (0, Oi.isBailoutToCSRError)(e) ||
      (0, Si.isDynamicUsageError)(e) ||
      (0, Ei.isPostpone)(e)
    )
      throw e
    e instanceof Error && 'cause' in e && Jn(e.cause)
  }
  ;(typeof de.default == 'function' || (typeof de.default == 'object' && de.default !== null)) &&
    typeof de.default.__esModule > 'u' &&
    (Object.defineProperty(de.default, '__esModule', { value: !0 }),
    Object.assign(de.default, de),
    (Qn.exports = de.default))
})
var tr = C((pe, er) => {
  'use strict'
  Object.defineProperty(pe, '__esModule', { value: !0 })
  function Ci(e, t) {
    for (var n in t) Object.defineProperty(e, n, { enumerable: !0, get: t[n] })
  }
  Ci(pe, {
    ReadonlyURLSearchParams: function () {
      return Vt
    },
    RedirectType: function () {
      return Wt.RedirectType
    },
    notFound: function () {
      return Ri.notFound
    },
    permanentRedirect: function () {
      return Wt.permanentRedirect
    },
    redirect: function () {
      return Wt.redirect
    },
    unstable_rethrow: function () {
      return Ai.unstable_rethrow
    },
  })
  var Wt = Qe(),
    Ri = Ze(),
    Ai = Zn(),
    Me = class extends Error {
      constructor() {
        super(
          'Method unavailable on `ReadonlyURLSearchParams`. Read more: https://nextjs.org/docs/app/api-reference/functions/use-search-params#updating-searchparams',
        )
      }
    },
    Vt = class extends URLSearchParams {
      append() {
        throw new Me()
      }
      delete() {
        throw new Me()
      }
      set() {
        throw new Me()
      }
      sort() {
        throw new Me()
      }
    }
  ;(typeof pe.default == 'function' || (typeof pe.default == 'object' && pe.default !== null)) &&
    typeof pe.default.__esModule > 'u' &&
    (Object.defineProperty(pe.default, '__esModule', { value: !0 }),
    Object.assign(pe.default, pe),
    (er.exports = pe.default))
})
var rr = C((Yt) => {
  'use strict'
  function nr(e) {
    if (typeof WeakMap != 'function') return null
    var t = new WeakMap(),
      n = new WeakMap()
    return (nr = function (r) {
      return r ? n : t
    })(e)
  }
  Yt._ = Yt._interop_require_wildcard = Li
  function Li(e, t) {
    if (!t && e && e.__esModule) return e
    if (e === null || (typeof e != 'object' && typeof e != 'function')) return { default: e }
    var n = nr(t)
    if (n && n.has(e)) return n.get(e)
    var r = { __proto__: null },
      o = Object.defineProperty && Object.getOwnPropertyDescriptor
    for (var i in e)
      if (i !== 'default' && Object.prototype.hasOwnProperty.call(e, i)) {
        var a = o ? Object.getOwnPropertyDescriptor(e, i) : null
        a && (a.get || a.set) ? Object.defineProperty(r, i, a) : (r[i] = e[i])
      }
    return (r.default = e), n && n.set(e, r), r
  }
})
var ar = C((zt) => {
  'use client'
  'use strict'
  Object.defineProperty(zt, '__esModule', { value: !0 })
  function Mi(e, t) {
    for (var n in t) Object.defineProperty(e, n, { enumerable: !0, get: t[n] })
  }
  Mi(zt, {
    ServerInsertedHTMLContext: function () {
      return ir
    },
    useServerInsertedHTML: function () {
      return ki
    },
  })
  var ji = rr(),
    or = ji._(He('react')),
    ir = or.default.createContext(null)
  function ki(e) {
    let t = (0, or.useContext)(ir)
    t && t(e)
  }
})
var cr = C((ge, sr) => {
  'use strict'
  Object.defineProperty(ge, '__esModule', { value: !0 })
  Object.defineProperty(ge, 'staticGenerationAsyncStorage', {
    enumerable: !0,
    get: function () {
      return Ni
    },
  })
  var Di = Xe(),
    Ni = (0, Di.createAsyncLocalStorage)()
  ;(typeof ge.default == 'function' || (typeof ge.default == 'object' && ge.default !== null)) &&
    typeof ge.default.__esModule > 'u' &&
    (Object.defineProperty(ge.default, '__esModule', { value: !0 }),
    Object.assign(ge.default, ge),
    (sr.exports = ge.default))
})
var ur = C((me, lr) => {
  'use strict'
  Object.defineProperty(me, '__esModule', { value: !0 })
  Object.defineProperty(me, 'staticGenerationAsyncStorage', {
    enumerable: !0,
    get: function () {
      return Fi.staticGenerationAsyncStorage
    },
  })
  var Fi = cr()
  ;(typeof me.default == 'function' || (typeof me.default == 'object' && me.default !== null)) &&
    typeof me.default.__esModule > 'u' &&
    (Object.defineProperty(me.default, '__esModule', { value: !0 }),
    Object.assign(me.default, me),
    (lr.exports = me.default))
})
var dr = C((ye, fr) => {
  'use strict'
  Object.defineProperty(ye, '__esModule', { value: !0 })
  Object.defineProperty(ye, 'bailoutToClientRendering', {
    enumerable: !0,
    get: function () {
      return $i
    },
  })
  var Ii = et(),
    qi = ur()
  function $i(e) {
    let t = qi.staticGenerationAsyncStorage.getStore()
    if (!t?.forceStatic && t?.isStaticGeneration) throw new Ii.BailoutToCSRError(e)
  }
  ;(typeof ye.default == 'function' || (typeof ye.default == 'object' && ye.default !== null)) &&
    typeof ye.default.__esModule > 'u' &&
    (Object.defineProperty(ye.default, '__esModule', { value: !0 }),
    Object.assign(ye.default, ye),
    (fr.exports = ye.default))
})
var br = C((he, vr) => {
  'use strict'
  Object.defineProperty(he, '__esModule', { value: !0 })
  function Ui(e, t) {
    for (var n in t) Object.defineProperty(e, n, { enumerable: !0, get: t[n] })
  }
  Ui(he, {
    ReadonlyURLSearchParams: function () {
      return Oe.ReadonlyURLSearchParams
    },
    RedirectType: function () {
      return Oe.RedirectType
    },
    ServerInsertedHTMLContext: function () {
      return pr.ServerInsertedHTMLContext
    },
    notFound: function () {
      return Oe.notFound
    },
    permanentRedirect: function () {
      return Oe.permanentRedirect
    },
    redirect: function () {
      return Oe.redirect
    },
    unstable_rethrow: function () {
      return Oe.unstable_rethrow
    },
    useParams: function () {
      return zi
    },
    usePathname: function () {
      return Vi
    },
    useRouter: function () {
      return Yi
    },
    useSearchParams: function () {
      return Wi
    },
    useSelectedLayoutSegment: function () {
      return Hi
    },
    useSelectedLayoutSegments: function () {
      return hr
    },
    useServerInsertedHTML: function () {
      return pr.useServerInsertedHTML
    },
  })
  var je = He('react'),
    gr = vn(),
    Ht = Tn(),
    Bi = Sn(),
    mr = En(),
    Oe = tr(),
    pr = ar()
  function Wi() {
    let e = (0, je.useContext)(Ht.SearchParamsContext),
      t = (0, je.useMemo)(() => (e ? new Oe.ReadonlyURLSearchParams(e) : null), [e])
    if (typeof window > 'u') {
      let { bailoutToClientRendering: n } = dr()
      n('useSearchParams()')
    }
    return t
  }
  function Vi() {
    return (0, je.useContext)(Ht.PathnameContext)
  }
  function Yi() {
    let e = (0, je.useContext)(gr.AppRouterContext)
    if (e === null) throw new Error('invariant expected app router to be mounted')
    return e
  }
  function zi() {
    return (0, je.useContext)(Ht.PathParamsContext)
  }
  function yr(e, t, n, r) {
    n === void 0 && (n = !0), r === void 0 && (r = [])
    let o
    if (n) o = e[1][t]
    else {
      let s = e[1]
      var i
      o = (i = s.children) != null ? i : Object.values(s)[0]
    }
    if (!o) return r
    let a = o[0],
      c = (0, Bi.getSegmentValue)(a)
    return !c || c.startsWith(mr.PAGE_SEGMENT_KEY) ? r : (r.push(c), yr(o, t, !1, r))
  }
  function hr(e) {
    e === void 0 && (e = 'children')
    let t = (0, je.useContext)(gr.LayoutRouterContext)
    return t ? yr(t.tree, e) : null
  }
  function Hi(e) {
    e === void 0 && (e = 'children')
    let t = hr(e)
    if (!t || t.length === 0) return null
    let n = e === 'children' ? t[0] : t[t.length - 1]
    return n === mr.DEFAULT_SEGMENT_KEY ? null : n
  }
  ;(typeof he.default == 'function' || (typeof he.default == 'object' && he.default !== null)) &&
    typeof he.default.__esModule > 'u' &&
    (Object.defineProperty(he.default, '__esModule', { value: !0 }),
    Object.assign(he.default, he),
    (vr.exports = he.default))
})
var wr = C((cs, xr) => {
  xr.exports = br()
})
var Lr = C((F) => {
  'use strict'
  var W = typeof Symbol == 'function' && Symbol.for,
    Gt = W ? Symbol.for('react.element') : 60103,
    Xt = W ? Symbol.for('react.portal') : 60106,
    rt = W ? Symbol.for('react.fragment') : 60107,
    ot = W ? Symbol.for('react.strict_mode') : 60108,
    it = W ? Symbol.for('react.profiler') : 60114,
    at = W ? Symbol.for('react.provider') : 60109,
    st = W ? Symbol.for('react.context') : 60110,
    Jt = W ? Symbol.for('react.async_mode') : 60111,
    ct = W ? Symbol.for('react.concurrent_mode') : 60111,
    lt = W ? Symbol.for('react.forward_ref') : 60112,
    ut = W ? Symbol.for('react.suspense') : 60113,
    la = W ? Symbol.for('react.suspense_list') : 60120,
    ft = W ? Symbol.for('react.memo') : 60115,
    dt = W ? Symbol.for('react.lazy') : 60116,
    ua = W ? Symbol.for('react.block') : 60121,
    fa = W ? Symbol.for('react.fundamental') : 60117,
    da = W ? Symbol.for('react.responder') : 60118,
    pa = W ? Symbol.for('react.scope') : 60119
  function X(e) {
    if (typeof e == 'object' && e !== null) {
      var t = e.$$typeof
      switch (t) {
        case Gt:
          switch (((e = e.type), e)) {
            case Jt:
            case ct:
            case rt:
            case it:
            case ot:
            case ut:
              return e
            default:
              switch (((e = e && e.$$typeof), e)) {
                case st:
                case lt:
                case dt:
                case ft:
                case at:
                  return e
                default:
                  return t
              }
          }
        case Xt:
          return t
      }
    }
  }
  function Ar(e) {
    return X(e) === ct
  }
  F.AsyncMode = Jt
  F.ConcurrentMode = ct
  F.ContextConsumer = st
  F.ContextProvider = at
  F.Element = Gt
  F.ForwardRef = lt
  F.Fragment = rt
  F.Lazy = dt
  F.Memo = ft
  F.Portal = Xt
  F.Profiler = it
  F.StrictMode = ot
  F.Suspense = ut
  F.isAsyncMode = function (e) {
    return Ar(e) || X(e) === Jt
  }
  F.isConcurrentMode = Ar
  F.isContextConsumer = function (e) {
    return X(e) === st
  }
  F.isContextProvider = function (e) {
    return X(e) === at
  }
  F.isElement = function (e) {
    return typeof e == 'object' && e !== null && e.$$typeof === Gt
  }
  F.isForwardRef = function (e) {
    return X(e) === lt
  }
  F.isFragment = function (e) {
    return X(e) === rt
  }
  F.isLazy = function (e) {
    return X(e) === dt
  }
  F.isMemo = function (e) {
    return X(e) === ft
  }
  F.isPortal = function (e) {
    return X(e) === Xt
  }
  F.isProfiler = function (e) {
    return X(e) === it
  }
  F.isStrictMode = function (e) {
    return X(e) === ot
  }
  F.isSuspense = function (e) {
    return X(e) === ut
  }
  F.isValidElementType = function (e) {
    return (
      typeof e == 'string' ||
      typeof e == 'function' ||
      e === rt ||
      e === ct ||
      e === it ||
      e === ot ||
      e === ut ||
      e === la ||
      (typeof e == 'object' &&
        e !== null &&
        (e.$$typeof === dt ||
          e.$$typeof === ft ||
          e.$$typeof === at ||
          e.$$typeof === st ||
          e.$$typeof === lt ||
          e.$$typeof === fa ||
          e.$$typeof === da ||
          e.$$typeof === pa ||
          e.$$typeof === ua))
    )
  }
  F.typeOf = X
})
var Mr = C((I) => {
  'use strict'
  process.env.NODE_ENV !== 'production' &&
    (function () {
      'use strict'
      var e = typeof Symbol == 'function' && Symbol.for,
        t = e ? Symbol.for('react.element') : 60103,
        n = e ? Symbol.for('react.portal') : 60106,
        r = e ? Symbol.for('react.fragment') : 60107,
        o = e ? Symbol.for('react.strict_mode') : 60108,
        i = e ? Symbol.for('react.profiler') : 60114,
        a = e ? Symbol.for('react.provider') : 60109,
        c = e ? Symbol.for('react.context') : 60110,
        s = e ? Symbol.for('react.async_mode') : 60111,
        l = e ? Symbol.for('react.concurrent_mode') : 60111,
        g = e ? Symbol.for('react.forward_ref') : 60112,
        f = e ? Symbol.for('react.suspense') : 60113,
        m = e ? Symbol.for('react.suspense_list') : 60120,
        d = e ? Symbol.for('react.memo') : 60115,
        y = e ? Symbol.for('react.lazy') : 60116,
        h = e ? Symbol.for('react.block') : 60121,
        v = e ? Symbol.for('react.fundamental') : 60117,
        x = e ? Symbol.for('react.responder') : 60118,
        E = e ? Symbol.for('react.scope') : 60119
      function O(b) {
        return (
          typeof b == 'string' ||
          typeof b == 'function' ||
          b === r ||
          b === l ||
          b === i ||
          b === o ||
          b === f ||
          b === m ||
          (typeof b == 'object' &&
            b !== null &&
            (b.$$typeof === y ||
              b.$$typeof === d ||
              b.$$typeof === a ||
              b.$$typeof === c ||
              b.$$typeof === g ||
              b.$$typeof === v ||
              b.$$typeof === x ||
              b.$$typeof === E ||
              b.$$typeof === h))
        )
      }
      function T(b) {
        if (typeof b == 'object' && b !== null) {
          var St = b.$$typeof
          switch (St) {
            case t:
              var ze = b.type
              switch (ze) {
                case s:
                case l:
                case r:
                case i:
                case o:
                case f:
                  return ze
                default:
                  var fn = ze && ze.$$typeof
                  switch (fn) {
                    case c:
                    case g:
                    case y:
                    case d:
                    case a:
                      return fn
                    default:
                      return St
                  }
              }
            case n:
              return St
          }
        }
      }
      var P = s,
        j = l,
        q = c,
        Y = a,
        $ = t,
        M = g,
        B = r,
        U = y,
        u = d,
        p = n,
        _ = i,
        S = o,
        w = f,
        R = !1
      function A(b) {
        return (
          R ||
            ((R = !0),
            console.warn(
              'The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.',
            )),
          L(b) || T(b) === s
        )
      }
      function L(b) {
        return T(b) === l
      }
      function k(b) {
        return T(b) === c
      }
      function N(b) {
        return T(b) === a
      }
      function D(b) {
        return typeof b == 'object' && b !== null && b.$$typeof === t
      }
      function H(b) {
        return T(b) === g
      }
      function z(b) {
        return T(b) === r
      }
      function Se(b) {
        return T(b) === y
      }
      function Co(b) {
        return T(b) === d
      }
      function Ro(b) {
        return T(b) === n
      }
      function Ao(b) {
        return T(b) === i
      }
      function Lo(b) {
        return T(b) === o
      }
      function Mo(b) {
        return T(b) === f
      }
      ;(I.AsyncMode = P),
        (I.ConcurrentMode = j),
        (I.ContextConsumer = q),
        (I.ContextProvider = Y),
        (I.Element = $),
        (I.ForwardRef = M),
        (I.Fragment = B),
        (I.Lazy = U),
        (I.Memo = u),
        (I.Portal = p),
        (I.Profiler = _),
        (I.StrictMode = S),
        (I.Suspense = w),
        (I.isAsyncMode = A),
        (I.isConcurrentMode = L),
        (I.isContextConsumer = k),
        (I.isContextProvider = N),
        (I.isElement = D),
        (I.isForwardRef = H),
        (I.isFragment = z),
        (I.isLazy = Se),
        (I.isMemo = Co),
        (I.isPortal = Ro),
        (I.isProfiler = Ao),
        (I.isStrictMode = Lo),
        (I.isSuspense = Mo),
        (I.isValidElementType = O),
        (I.typeOf = T)
    })()
})
var Zt = C((Us, Qt) => {
  'use strict'
  process.env.NODE_ENV === 'production' ? (Qt.exports = Lr()) : (Qt.exports = Mr())
})
var Dr = C((Bs, kr) => {
  'use strict'
  var jr = Object.getOwnPropertySymbols,
    ga = Object.prototype.hasOwnProperty,
    ma = Object.prototype.propertyIsEnumerable
  function ya(e) {
    if (e == null) throw new TypeError('Object.assign cannot be called with null or undefined')
    return Object(e)
  }
  function ha() {
    try {
      if (!Object.assign) return !1
      var e = new String('abc')
      if (((e[5] = 'de'), Object.getOwnPropertyNames(e)[0] === '5')) return !1
      for (var t = {}, n = 0; n < 10; n++) t['_' + String.fromCharCode(n)] = n
      var r = Object.getOwnPropertyNames(t).map(function (i) {
        return t[i]
      })
      if (r.join('') !== '0123456789') return !1
      var o = {}
      return (
        'abcdefghijklmnopqrst'.split('').forEach(function (i) {
          o[i] = i
        }),
        Object.keys(Object.assign({}, o)).join('') === 'abcdefghijklmnopqrst'
      )
    } catch {
      return !1
    }
  }
  kr.exports = ha()
    ? Object.assign
    : function (e, t) {
        for (var n, r = ya(e), o, i = 1; i < arguments.length; i++) {
          n = Object(arguments[i])
          for (var a in n) ga.call(n, a) && (r[a] = n[a])
          if (jr) {
            o = jr(n)
            for (var c = 0; c < o.length; c++) ma.call(n, o[c]) && (r[o[c]] = n[o[c]])
          }
        }
        return r
      }
})
var pt = C((Ws, Nr) => {
  'use strict'
  var va = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED'
  Nr.exports = va
})
var en = C((Vs, Fr) => {
  Fr.exports = Function.call.bind(Object.prototype.hasOwnProperty)
})
var Br = C((Ys, Ur) => {
  'use strict'
  var tn = function () {}
  process.env.NODE_ENV !== 'production' &&
    ((Ir = pt()),
    (gt = {}),
    (qr = en()),
    (tn = function (e) {
      var t = 'Warning: ' + e
      typeof console < 'u' && console.error(t)
      try {
        throw new Error(t)
      } catch {}
    }))
  var Ir, gt, qr
  function $r(e, t, n, r, o) {
    if (process.env.NODE_ENV !== 'production') {
      for (var i in e)
        if (qr(e, i)) {
          var a
          try {
            if (typeof e[i] != 'function') {
              var c = Error(
                (r || 'React class') +
                  ': ' +
                  n +
                  ' type `' +
                  i +
                  '` is invalid; it must be a function, usually from the `prop-types` package, but received `' +
                  typeof e[i] +
                  '`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.',
              )
              throw ((c.name = 'Invariant Violation'), c)
            }
            a = e[i](t, i, r, n, null, Ir)
          } catch (l) {
            a = l
          }
          if (
            (a &&
              !(a instanceof Error) &&
              tn(
                (r || 'React class') +
                  ': type specification of ' +
                  n +
                  ' `' +
                  i +
                  '` is invalid; the type checker function must return `null` or an `Error` but returned a ' +
                  typeof a +
                  '. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).',
              ),
            a instanceof Error && !(a.message in gt))
          ) {
            gt[a.message] = !0
            var s = o ? o() : ''
            tn('Failed ' + n + ' type: ' + a.message + (s ?? ''))
          }
        }
    }
  }
  $r.resetWarningCache = function () {
    process.env.NODE_ENV !== 'production' && (gt = {})
  }
  Ur.exports = $r
})
var Yr = C((zs, Vr) => {
  'use strict'
  var ba = Zt(),
    xa = Dr(),
    ke = pt(),
    nn = en(),
    Wr = Br(),
    De = function () {}
  process.env.NODE_ENV !== 'production' &&
    (De = function (e) {
      var t = 'Warning: ' + e
      typeof console < 'u' && console.error(t)
      try {
        throw new Error(t)
      } catch {}
    })
  function mt() {
    return null
  }
  Vr.exports = function (e, t) {
    var n = typeof Symbol == 'function' && Symbol.iterator,
      r = '@@iterator'
    function o(u) {
      var p = u && ((n && u[n]) || u[r])
      if (typeof p == 'function') return p
    }
    var i = '<<anonymous>>',
      a = {
        array: g('array'),
        bigint: g('bigint'),
        bool: g('boolean'),
        func: g('function'),
        number: g('number'),
        object: g('object'),
        string: g('string'),
        symbol: g('symbol'),
        any: f(),
        arrayOf: m,
        element: d(),
        elementType: y(),
        instanceOf: h,
        node: O(),
        objectOf: x,
        oneOf: v,
        oneOfType: E,
        shape: P,
        exact: j,
      }
    function c(u, p) {
      return u === p ? u !== 0 || 1 / u === 1 / p : u !== u && p !== p
    }
    function s(u, p) {
      ;(this.message = u), (this.data = p && typeof p == 'object' ? p : {}), (this.stack = '')
    }
    s.prototype = Error.prototype
    function l(u) {
      if (process.env.NODE_ENV !== 'production')
        var p = {},
          _ = 0
      function S(R, A, L, k, N, D, H) {
        if (((k = k || i), (D = D || L), H !== ke)) {
          if (t) {
            var z = new Error(
              'Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types',
            )
            throw ((z.name = 'Invariant Violation'), z)
          } else if (process.env.NODE_ENV !== 'production' && typeof console < 'u') {
            var Se = k + ':' + L
            !p[Se] &&
              _ < 3 &&
              (De(
                'You are manually calling a React.PropTypes validation function for the `' +
                  D +
                  '` prop on `' +
                  k +
                  '`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details.',
              ),
              (p[Se] = !0),
              _++)
          }
        }
        return A[L] == null
          ? R
            ? A[L] === null
              ? new s(
                  'The ' +
                    N +
                    ' `' +
                    D +
                    '` is marked as required ' +
                    ('in `' + k + '`, but its value is `null`.'),
                )
              : new s(
                  'The ' +
                    N +
                    ' `' +
                    D +
                    '` is marked as required in ' +
                    ('`' + k + '`, but its value is `undefined`.'),
                )
            : null
          : u(A, L, k, N, D)
      }
      var w = S.bind(null, !1)
      return (w.isRequired = S.bind(null, !0)), w
    }
    function g(u) {
      function p(_, S, w, R, A, L) {
        var k = _[S],
          N = $(k)
        if (N !== u) {
          var D = M(k)
          return new s(
            'Invalid ' +
              R +
              ' `' +
              A +
              '` of type ' +
              ('`' + D + '` supplied to `' + w + '`, expected ') +
              ('`' + u + '`.'),
            { expectedType: u },
          )
        }
        return null
      }
      return l(p)
    }
    function f() {
      return l(mt)
    }
    function m(u) {
      function p(_, S, w, R, A) {
        if (typeof u != 'function')
          return new s(
            'Property `' +
              A +
              '` of component `' +
              w +
              '` has invalid PropType notation inside arrayOf.',
          )
        var L = _[S]
        if (!Array.isArray(L)) {
          var k = $(L)
          return new s(
            'Invalid ' +
              R +
              ' `' +
              A +
              '` of type ' +
              ('`' + k + '` supplied to `' + w + '`, expected an array.'),
          )
        }
        for (var N = 0; N < L.length; N++) {
          var D = u(L, N, w, R, A + '[' + N + ']', ke)
          if (D instanceof Error) return D
        }
        return null
      }
      return l(p)
    }
    function d() {
      function u(p, _, S, w, R) {
        var A = p[_]
        if (!e(A)) {
          var L = $(A)
          return new s(
            'Invalid ' +
              w +
              ' `' +
              R +
              '` of type ' +
              ('`' + L + '` supplied to `' + S + '`, expected a single ReactElement.'),
          )
        }
        return null
      }
      return l(u)
    }
    function y() {
      function u(p, _, S, w, R) {
        var A = p[_]
        if (!ba.isValidElementType(A)) {
          var L = $(A)
          return new s(
            'Invalid ' +
              w +
              ' `' +
              R +
              '` of type ' +
              ('`' + L + '` supplied to `' + S + '`, expected a single ReactElement type.'),
          )
        }
        return null
      }
      return l(u)
    }
    function h(u) {
      function p(_, S, w, R, A) {
        if (!(_[S] instanceof u)) {
          var L = u.name || i,
            k = U(_[S])
          return new s(
            'Invalid ' +
              R +
              ' `' +
              A +
              '` of type ' +
              ('`' + k + '` supplied to `' + w + '`, expected ') +
              ('instance of `' + L + '`.'),
          )
        }
        return null
      }
      return l(p)
    }
    function v(u) {
      if (!Array.isArray(u))
        return (
          process.env.NODE_ENV !== 'production' &&
            (arguments.length > 1
              ? De(
                  'Invalid arguments supplied to oneOf, expected an array, got ' +
                    arguments.length +
                    ' arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z]).',
                )
              : De('Invalid argument supplied to oneOf, expected an array.')),
          mt
        )
      function p(_, S, w, R, A) {
        for (var L = _[S], k = 0; k < u.length; k++) if (c(L, u[k])) return null
        var N = JSON.stringify(u, function (H, z) {
          var Se = M(z)
          return Se === 'symbol' ? String(z) : z
        })
        return new s(
          'Invalid ' +
            R +
            ' `' +
            A +
            '` of value `' +
            String(L) +
            '` ' +
            ('supplied to `' + w + '`, expected one of ' + N + '.'),
        )
      }
      return l(p)
    }
    function x(u) {
      function p(_, S, w, R, A) {
        if (typeof u != 'function')
          return new s(
            'Property `' +
              A +
              '` of component `' +
              w +
              '` has invalid PropType notation inside objectOf.',
          )
        var L = _[S],
          k = $(L)
        if (k !== 'object')
          return new s(
            'Invalid ' +
              R +
              ' `' +
              A +
              '` of type ' +
              ('`' + k + '` supplied to `' + w + '`, expected an object.'),
          )
        for (var N in L)
          if (nn(L, N)) {
            var D = u(L, N, w, R, A + '.' + N, ke)
            if (D instanceof Error) return D
          }
        return null
      }
      return l(p)
    }
    function E(u) {
      if (!Array.isArray(u))
        return (
          process.env.NODE_ENV !== 'production' &&
            De('Invalid argument supplied to oneOfType, expected an instance of array.'),
          mt
        )
      for (var p = 0; p < u.length; p++) {
        var _ = u[p]
        if (typeof _ != 'function')
          return (
            De(
              'Invalid argument supplied to oneOfType. Expected an array of check functions, but received ' +
                B(_) +
                ' at index ' +
                p +
                '.',
            ),
            mt
          )
      }
      function S(w, R, A, L, k) {
        for (var N = [], D = 0; D < u.length; D++) {
          var H = u[D],
            z = H(w, R, A, L, k, ke)
          if (z == null) return null
          z.data && nn(z.data, 'expectedType') && N.push(z.data.expectedType)
        }
        var Se = N.length > 0 ? ', expected one of type [' + N.join(', ') + ']' : ''
        return new s('Invalid ' + L + ' `' + k + '` supplied to ' + ('`' + A + '`' + Se + '.'))
      }
      return l(S)
    }
    function O() {
      function u(p, _, S, w, R) {
        return q(p[_])
          ? null
          : new s(
              'Invalid ' + w + ' `' + R + '` supplied to ' + ('`' + S + '`, expected a ReactNode.'),
            )
      }
      return l(u)
    }
    function T(u, p, _, S, w) {
      return new s(
        (u || 'React class') +
          ': ' +
          p +
          ' type `' +
          _ +
          '.' +
          S +
          '` is invalid; it must be a function, usually from the `prop-types` package, but received `' +
          w +
          '`.',
      )
    }
    function P(u) {
      function p(_, S, w, R, A) {
        var L = _[S],
          k = $(L)
        if (k !== 'object')
          return new s(
            'Invalid ' +
              R +
              ' `' +
              A +
              '` of type `' +
              k +
              '` ' +
              ('supplied to `' + w + '`, expected `object`.'),
          )
        for (var N in u) {
          var D = u[N]
          if (typeof D != 'function') return T(w, R, A, N, M(D))
          var H = D(L, N, w, R, A + '.' + N, ke)
          if (H) return H
        }
        return null
      }
      return l(p)
    }
    function j(u) {
      function p(_, S, w, R, A) {
        var L = _[S],
          k = $(L)
        if (k !== 'object')
          return new s(
            'Invalid ' +
              R +
              ' `' +
              A +
              '` of type `' +
              k +
              '` ' +
              ('supplied to `' + w + '`, expected `object`.'),
          )
        var N = xa({}, _[S], u)
        for (var D in N) {
          var H = u[D]
          if (nn(u, D) && typeof H != 'function') return T(w, R, A, D, M(H))
          if (!H)
            return new s(
              'Invalid ' +
                R +
                ' `' +
                A +
                '` key `' +
                D +
                '` supplied to `' +
                w +
                '`.\nBad object: ' +
                JSON.stringify(_[S], null, '  ') +
                `
Valid keys: ` +
                JSON.stringify(Object.keys(u), null, '  '),
            )
          var z = H(L, D, w, R, A + '.' + D, ke)
          if (z) return z
        }
        return null
      }
      return l(p)
    }
    function q(u) {
      switch (typeof u) {
        case 'number':
        case 'string':
        case 'undefined':
          return !0
        case 'boolean':
          return !u
        case 'object':
          if (Array.isArray(u)) return u.every(q)
          if (u === null || e(u)) return !0
          var p = o(u)
          if (p) {
            var _ = p.call(u),
              S
            if (p !== u.entries) {
              for (; !(S = _.next()).done; ) if (!q(S.value)) return !1
            } else
              for (; !(S = _.next()).done; ) {
                var w = S.value
                if (w && !q(w[1])) return !1
              }
          } else return !1
          return !0
        default:
          return !1
      }
    }
    function Y(u, p) {
      return u === 'symbol'
        ? !0
        : p
          ? p['@@toStringTag'] === 'Symbol' || (typeof Symbol == 'function' && p instanceof Symbol)
          : !1
    }
    function $(u) {
      var p = typeof u
      return Array.isArray(u) ? 'array' : u instanceof RegExp ? 'object' : Y(p, u) ? 'symbol' : p
    }
    function M(u) {
      if (typeof u > 'u' || u === null) return '' + u
      var p = $(u)
      if (p === 'object') {
        if (u instanceof Date) return 'date'
        if (u instanceof RegExp) return 'regexp'
      }
      return p
    }
    function B(u) {
      var p = M(u)
      switch (p) {
        case 'array':
        case 'object':
          return 'an ' + p
        case 'boolean':
        case 'date':
        case 'regexp':
          return 'a ' + p
        default:
          return p
      }
    }
    function U(u) {
      return !u.constructor || !u.constructor.name ? i : u.constructor.name
    }
    return (
      (a.checkPropTypes = Wr), (a.resetWarningCache = Wr.resetWarningCache), (a.PropTypes = a), a
    )
  }
})
var Gr = C((Hs, Kr) => {
  'use strict'
  var wa = pt()
  function zr() {}
  function Hr() {}
  Hr.resetWarningCache = zr
  Kr.exports = function () {
    function e(r, o, i, a, c, s) {
      if (s !== wa) {
        var l = new Error(
          'Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types',
        )
        throw ((l.name = 'Invariant Violation'), l)
      }
    }
    e.isRequired = e
    function t() {
      return e
    }
    var n = {
      array: e,
      bigint: e,
      bool: e,
      func: e,
      number: e,
      object: e,
      string: e,
      symbol: e,
      any: e,
      arrayOf: t,
      element: e,
      elementType: e,
      instanceOf: t,
      node: e,
      objectOf: t,
      oneOf: t,
      oneOfType: t,
      shape: t,
      exact: t,
      checkPropTypes: Hr,
      resetWarningCache: zr,
    }
    return (n.PropTypes = n), n
  }
})
var Ta = C((Ks, rn) => {
  process.env.NODE_ENV !== 'production'
    ? ((Xr = Zt()), (Jr = !0), (rn.exports = Yr()(Xr.isElement, Jr)))
    : (rn.exports = Gr()())
  var Xr, Jr
})
function we(e) {
  return Zr(e) ? (e.nodeName || '').toLowerCase() : '#document'
}
function K(e) {
  var t
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window
}
function be(e) {
  var t
  return (t = (Zr(e) ? e.ownerDocument : e.document) || window.document) == null
    ? void 0
    : t.documentElement
}
function Zr(e) {
  return e instanceof Node || e instanceof K(e).Node
}
function xe(e) {
  return e instanceof Element || e instanceof K(e).Element
}
function ve(e) {
  return e instanceof HTMLElement || e instanceof K(e).HTMLElement
}
function Qr(e) {
  return typeof ShadowRoot > 'u' ? !1 : e instanceof ShadowRoot || e instanceof K(e).ShadowRoot
}
function Ne(e) {
  let { overflow: t, overflowX: n, overflowY: r, display: o } = J(e)
  return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && !['inline', 'contents'].includes(o)
}
function eo(e) {
  return ['table', 'td', 'th'].includes(we(e))
}
function yt(e) {
  let t = ht(),
    n = J(e)
  return (
    n.transform !== 'none' ||
    n.perspective !== 'none' ||
    (n.containerType ? n.containerType !== 'normal' : !1) ||
    (!t && (n.backdropFilter ? n.backdropFilter !== 'none' : !1)) ||
    (!t && (n.filter ? n.filter !== 'none' : !1)) ||
    ['transform', 'perspective', 'filter'].some((r) => (n.willChange || '').includes(r)) ||
    ['paint', 'layout', 'strict', 'content'].some((r) => (n.contain || '').includes(r))
  )
}
function to(e) {
  let t = Pe(e)
  for (; ve(t) && !$e(t); ) {
    if (yt(t)) return t
    t = Pe(t)
  }
  return null
}
function ht() {
  return typeof CSS > 'u' || !CSS.supports ? !1 : CSS.supports('-webkit-backdrop-filter', 'none')
}
function $e(e) {
  return ['html', 'body', '#document'].includes(we(e))
}
function J(e) {
  return K(e).getComputedStyle(e)
}
function Ue(e) {
  return xe(e)
    ? { scrollLeft: e.scrollLeft, scrollTop: e.scrollTop }
    : { scrollLeft: e.pageXOffset, scrollTop: e.pageYOffset }
}
function Pe(e) {
  if (we(e) === 'html') return e
  let t = e.assignedSlot || e.parentNode || (Qr(e) && e.host) || be(e)
  return Qr(t) ? t.host : t
}
function no(e) {
  let t = Pe(e)
  return $e(t) ? (e.ownerDocument ? e.ownerDocument.body : e.body) : ve(t) && Ne(t) ? t : no(t)
}
function Ce(e, t, n) {
  var r
  t === void 0 && (t = []), n === void 0 && (n = !0)
  let o = no(e),
    i = o === ((r = e.ownerDocument) == null ? void 0 : r.body),
    a = K(o)
  return i
    ? t.concat(
        a,
        a.visualViewport || [],
        Ne(o) ? o : [],
        a.frameElement && n ? Ce(a.frameElement) : [],
      )
    : t.concat(o, Ce(o, [], n))
}
var on = Ke(() => {})
function vt(e, t, n) {
  return V(e, Q(t, n))
}
function Z(e, t) {
  return typeof e == 'function' ? e(t) : e
}
function G(e) {
  return e.split('-')[0]
}
function ee(e) {
  return e.split('-')[1]
}
function bt(e) {
  return e === 'x' ? 'y' : 'x'
}
function xt(e) {
  return e === 'y' ? 'height' : 'width'
}
function Ee(e) {
  return ['top', 'bottom'].includes(G(e)) ? 'y' : 'x'
}
function wt(e) {
  return bt(Ee(e))
}
function cn(e, t, n) {
  n === void 0 && (n = !1)
  let r = ee(e),
    o = wt(e),
    i = xt(o),
    a =
      o === 'x'
        ? r === (n ? 'end' : 'start')
          ? 'right'
          : 'left'
        : r === 'start'
          ? 'bottom'
          : 'top'
  return t.reference[i] > t.floating[i] && (a = We(a)), [a, We(a)]
}
function oo(e) {
  let t = We(e)
  return [Be(e), t, Be(t)]
}
function Be(e) {
  return e.replace(/start|end/g, (t) => Sa[t])
}
function Ea(e, t, n) {
  let r = ['left', 'right'],
    o = ['right', 'left'],
    i = ['top', 'bottom'],
    a = ['bottom', 'top']
  switch (e) {
    case 'top':
    case 'bottom':
      return n ? (t ? o : r) : t ? r : o
    case 'left':
    case 'right':
      return t ? i : a
    default:
      return []
  }
}
function io(e, t, n, r) {
  let o = ee(e),
    i = Ea(G(e), n === 'start', r)
  return o && ((i = i.map((a) => a + '-' + o)), t && (i = i.concat(i.map(Be)))), i
}
function We(e) {
  return e.replace(/left|right|bottom|top/g, (t) => _a[t])
}
function Oa(e) {
  return { top: 0, right: 0, bottom: 0, left: 0, ...e }
}
function Tt(e) {
  return typeof e != 'number' ? Oa(e) : { top: e, right: e, bottom: e, left: e }
}
function _e(e) {
  return { ...e, top: e.y, left: e.x, right: e.x + e.width, bottom: e.y + e.height }
}
var an,
  ro,
  sn,
  Q,
  V,
  Ve,
  Ye,
  Te,
  _a,
  Sa,
  _t = Ke(() => {
    ;(an = ['top', 'right', 'bottom', 'left']),
      (ro = ['start', 'end']),
      (sn = an.reduce((e, t) => e.concat(t, t + '-' + ro[0], t + '-' + ro[1]), [])),
      (Q = Math.min),
      (V = Math.max),
      (Ve = Math.round),
      (Ye = Math.floor),
      (Te = (e) => ({ x: e, y: e })),
      (_a = { left: 'right', right: 'left', bottom: 'top', top: 'bottom' }),
      (Sa = { start: 'end', end: 'start' })
  })
function ao(e, t, n) {
  let { reference: r, floating: o } = e,
    i = Ee(t),
    a = wt(t),
    c = xt(a),
    s = G(t),
    l = i === 'y',
    g = r.x + r.width / 2 - o.width / 2,
    f = r.y + r.height / 2 - o.height / 2,
    m = r[c] / 2 - o[c] / 2,
    d
  switch (s) {
    case 'top':
      d = { x: g, y: r.y - o.height }
      break
    case 'bottom':
      d = { x: g, y: r.y + r.height }
      break
    case 'right':
      d = { x: r.x + r.width, y: f }
      break
    case 'left':
      d = { x: r.x - o.width, y: f }
      break
    default:
      d = { x: r.x, y: r.y }
  }
  switch (ee(t)) {
    case 'start':
      d[a] -= m * (n && l ? -1 : 1)
      break
    case 'end':
      d[a] += m * (n && l ? -1 : 1)
      break
  }
  return d
}
async function Re(e, t) {
  var n
  t === void 0 && (t = {})
  let { x: r, y: o, platform: i, rects: a, elements: c, strategy: s } = e,
    {
      boundary: l = 'clippingAncestors',
      rootBoundary: g = 'viewport',
      elementContext: f = 'floating',
      altBoundary: m = !1,
      padding: d = 0,
    } = Z(t, e),
    y = Tt(d),
    v = c[m ? (f === 'floating' ? 'reference' : 'floating') : f],
    x = _e(
      await i.getClippingRect({
        element:
          (n = await (i.isElement == null ? void 0 : i.isElement(v))) == null || n
            ? v
            : v.contextElement ||
              (await (i.getDocumentElement == null ? void 0 : i.getDocumentElement(c.floating))),
        boundary: l,
        rootBoundary: g,
        strategy: s,
      }),
    ),
    E = f === 'floating' ? { ...a.floating, x: r, y: o } : a.reference,
    O = await (i.getOffsetParent == null ? void 0 : i.getOffsetParent(c.floating)),
    T = (await (i.isElement == null ? void 0 : i.isElement(O)))
      ? (await (i.getScale == null ? void 0 : i.getScale(O))) || { x: 1, y: 1 }
      : { x: 1, y: 1 },
    P = _e(
      i.convertOffsetParentRelativeRectToViewportRelativeRect
        ? await i.convertOffsetParentRelativeRectToViewportRelativeRect({
            elements: c,
            rect: E,
            offsetParent: O,
            strategy: s,
          })
        : E,
    )
  return {
    top: (x.top - P.top + y.top) / T.y,
    bottom: (P.bottom - x.bottom + y.bottom) / T.y,
    left: (x.left - P.left + y.left) / T.x,
    right: (P.right - x.right + y.right) / T.x,
  }
}
function Pa(e, t, n) {
  return (
    e
      ? [...n.filter((o) => ee(o) === e), ...n.filter((o) => ee(o) !== e)]
      : n.filter((o) => G(o) === o)
  ).filter((o) => (e ? ee(o) === e || (t ? Be(o) !== o : !1) : !0))
}
function so(e, t) {
  return {
    top: e.top - t.height,
    right: e.right - t.width,
    bottom: e.bottom - t.height,
    left: e.left - t.width,
  }
}
function co(e) {
  return an.some((t) => e[t] >= 0)
}
function mo(e) {
  let t = Q(...e.map((i) => i.left)),
    n = Q(...e.map((i) => i.top)),
    r = V(...e.map((i) => i.right)),
    o = V(...e.map((i) => i.bottom))
  return { x: t, y: n, width: r - t, height: o - n }
}
function Ca(e) {
  let t = e.slice().sort((o, i) => o.y - i.y),
    n = [],
    r = null
  for (let o = 0; o < t.length; o++) {
    let i = t[o]
    !r || i.y - r.y > r.height / 2 ? n.push([i]) : n[n.length - 1].push(i), (r = i)
  }
  return n.map((o) => _e(mo(o)))
}
async function Ra(e, t) {
  let { placement: n, platform: r, elements: o } = e,
    i = await (r.isRTL == null ? void 0 : r.isRTL(o.floating)),
    a = G(n),
    c = ee(n),
    s = Ee(n) === 'y',
    l = ['left', 'top'].includes(a) ? -1 : 1,
    g = i && s ? -1 : 1,
    f = Z(t, e),
    {
      mainAxis: m,
      crossAxis: d,
      alignmentAxis: y,
    } = typeof f == 'number'
      ? { mainAxis: f, crossAxis: 0, alignmentAxis: null }
      : { mainAxis: 0, crossAxis: 0, alignmentAxis: null, ...f }
  return (
    c && typeof y == 'number' && (d = c === 'end' ? y * -1 : y),
    s ? { x: d * g, y: m * l } : { x: m * l, y: d * g }
  )
}
var lo,
  uo,
  fo,
  po,
  go,
  yo,
  Aa,
  ho,
  vo,
  bo,
  ln = Ke(() => {
    _t()
    _t()
    lo = async (e, t, n) => {
      let {
          placement: r = 'bottom',
          strategy: o = 'absolute',
          middleware: i = [],
          platform: a,
        } = n,
        c = i.filter(Boolean),
        s = await (a.isRTL == null ? void 0 : a.isRTL(t)),
        l = await a.getElementRects({ reference: e, floating: t, strategy: o }),
        { x: g, y: f } = ao(l, r, s),
        m = r,
        d = {},
        y = 0
      for (let h = 0; h < c.length; h++) {
        let { name: v, fn: x } = c[h],
          {
            x: E,
            y: O,
            data: T,
            reset: P,
          } = await x({
            x: g,
            y: f,
            initialPlacement: r,
            placement: m,
            strategy: o,
            middlewareData: d,
            rects: l,
            platform: a,
            elements: { reference: e, floating: t },
          })
        ;(g = E ?? g),
          (f = O ?? f),
          (d = { ...d, [v]: { ...d[v], ...T } }),
          P &&
            y <= 50 &&
            (y++,
            typeof P == 'object' &&
              (P.placement && (m = P.placement),
              P.rects &&
                (l =
                  P.rects === !0
                    ? await a.getElementRects({ reference: e, floating: t, strategy: o })
                    : P.rects),
              ({ x: g, y: f } = ao(l, m, s))),
            (h = -1))
      }
      return { x: g, y: f, placement: m, strategy: o, middlewareData: d }
    }
    uo = (e) => ({
      name: 'arrow',
      options: e,
      async fn(t) {
        let { x: n, y: r, placement: o, rects: i, platform: a, elements: c, middlewareData: s } = t,
          { element: l, padding: g = 0 } = Z(e, t) || {}
        if (l == null) return {}
        let f = Tt(g),
          m = { x: n, y: r },
          d = wt(o),
          y = xt(d),
          h = await a.getDimensions(l),
          v = d === 'y',
          x = v ? 'top' : 'left',
          E = v ? 'bottom' : 'right',
          O = v ? 'clientHeight' : 'clientWidth',
          T = i.reference[y] + i.reference[d] - m[d] - i.floating[y],
          P = m[d] - i.reference[d],
          j = await (a.getOffsetParent == null ? void 0 : a.getOffsetParent(l)),
          q = j ? j[O] : 0
        ;(!q || !(await (a.isElement == null ? void 0 : a.isElement(j)))) &&
          (q = c.floating[O] || i.floating[y])
        let Y = T / 2 - P / 2,
          $ = q / 2 - h[y] / 2 - 1,
          M = Q(f[x], $),
          B = Q(f[E], $),
          U = M,
          u = q - h[y] - B,
          p = q / 2 - h[y] / 2 + Y,
          _ = vt(U, p, u),
          S =
            !s.arrow &&
            ee(o) != null &&
            p !== _ &&
            i.reference[y] / 2 - (p < U ? M : B) - h[y] / 2 < 0,
          w = S ? (p < U ? p - U : p - u) : 0
        return {
          [d]: m[d] + w,
          data: { [d]: _, centerOffset: p - _ - w, ...(S && { alignmentOffset: w }) },
          reset: S,
        }
      },
    })
    ;(fo = function (e) {
      return (
        e === void 0 && (e = {}),
        {
          name: 'autoPlacement',
          options: e,
          async fn(t) {
            var n, r, o
            let { rects: i, middlewareData: a, placement: c, platform: s, elements: l } = t,
              {
                crossAxis: g = !1,
                alignment: f,
                allowedPlacements: m = sn,
                autoAlignment: d = !0,
                ...y
              } = Z(e, t),
              h = f !== void 0 || m === sn ? Pa(f || null, d, m) : m,
              v = await Re(t, y),
              x = ((n = a.autoPlacement) == null ? void 0 : n.index) || 0,
              E = h[x]
            if (E == null) return {}
            let O = cn(E, i, await (s.isRTL == null ? void 0 : s.isRTL(l.floating)))
            if (c !== E) return { reset: { placement: h[0] } }
            let T = [v[G(E)], v[O[0]], v[O[1]]],
              P = [
                ...(((r = a.autoPlacement) == null ? void 0 : r.overflows) || []),
                { placement: E, overflows: T },
              ],
              j = h[x + 1]
            if (j) return { data: { index: x + 1, overflows: P }, reset: { placement: j } }
            let q = P.map((M) => {
                let B = ee(M.placement)
                return [
                  M.placement,
                  B && g ? M.overflows.slice(0, 2).reduce((U, u) => U + u, 0) : M.overflows[0],
                  M.overflows,
                ]
              }).sort((M, B) => M[1] - B[1]),
              $ =
                ((o = q.filter((M) => M[2].slice(0, ee(M[0]) ? 2 : 3).every((B) => B <= 0))[0]) ==
                null
                  ? void 0
                  : o[0]) || q[0][0]
            return $ !== c ? { data: { index: x + 1, overflows: P }, reset: { placement: $ } } : {}
          },
        }
      )
    }),
      (po = function (e) {
        return (
          e === void 0 && (e = {}),
          {
            name: 'flip',
            options: e,
            async fn(t) {
              var n, r
              let {
                  placement: o,
                  middlewareData: i,
                  rects: a,
                  initialPlacement: c,
                  platform: s,
                  elements: l,
                } = t,
                {
                  mainAxis: g = !0,
                  crossAxis: f = !0,
                  fallbackPlacements: m,
                  fallbackStrategy: d = 'bestFit',
                  fallbackAxisSideDirection: y = 'none',
                  flipAlignment: h = !0,
                  ...v
                } = Z(e, t)
              if ((n = i.arrow) != null && n.alignmentOffset) return {}
              let x = G(o),
                E = G(c) === c,
                O = await (s.isRTL == null ? void 0 : s.isRTL(l.floating)),
                T = m || (E || !h ? [We(c)] : oo(c))
              !m && y !== 'none' && T.push(...io(c, h, y, O))
              let P = [c, ...T],
                j = await Re(t, v),
                q = [],
                Y = ((r = i.flip) == null ? void 0 : r.overflows) || []
              if ((g && q.push(j[x]), f)) {
                let U = cn(o, a, O)
                q.push(j[U[0]], j[U[1]])
              }
              if (((Y = [...Y, { placement: o, overflows: q }]), !q.every((U) => U <= 0))) {
                var $, M
                let U = ((($ = i.flip) == null ? void 0 : $.index) || 0) + 1,
                  u = P[U]
                if (u) return { data: { index: U, overflows: Y }, reset: { placement: u } }
                let p =
                  (M = Y.filter((_) => _.overflows[0] <= 0).sort(
                    (_, S) => _.overflows[1] - S.overflows[1],
                  )[0]) == null
                    ? void 0
                    : M.placement
                if (!p)
                  switch (d) {
                    case 'bestFit': {
                      var B
                      let _ =
                        (B = Y.map((S) => [
                          S.placement,
                          S.overflows.filter((w) => w > 0).reduce((w, R) => w + R, 0),
                        ]).sort((S, w) => S[1] - w[1])[0]) == null
                          ? void 0
                          : B[0]
                      _ && (p = _)
                      break
                    }
                    case 'initialPlacement':
                      p = c
                      break
                  }
                if (o !== p) return { reset: { placement: p } }
              }
              return {}
            },
          }
        )
      })
    go = function (e) {
      return (
        e === void 0 && (e = {}),
        {
          name: 'hide',
          options: e,
          async fn(t) {
            let { rects: n } = t,
              { strategy: r = 'referenceHidden', ...o } = Z(e, t)
            switch (r) {
              case 'referenceHidden': {
                let i = await Re(t, { ...o, elementContext: 'reference' }),
                  a = so(i, n.reference)
                return { data: { referenceHiddenOffsets: a, referenceHidden: co(a) } }
              }
              case 'escaped': {
                let i = await Re(t, { ...o, altBoundary: !0 }),
                  a = so(i, n.floating)
                return { data: { escapedOffsets: a, escaped: co(a) } }
              }
              default:
                return {}
            }
          },
        }
      )
    }
    yo = function (e) {
      return (
        e === void 0 && (e = {}),
        {
          name: 'inline',
          options: e,
          async fn(t) {
            let { placement: n, elements: r, rects: o, platform: i, strategy: a } = t,
              { padding: c = 2, x: s, y: l } = Z(e, t),
              g = Array.from(
                (await (i.getClientRects == null ? void 0 : i.getClientRects(r.reference))) || [],
              ),
              f = Ca(g),
              m = _e(mo(g)),
              d = Tt(c)
            function y() {
              if (f.length === 2 && f[0].left > f[1].right && s != null && l != null)
                return (
                  f.find(
                    (v) =>
                      s > v.left - d.left &&
                      s < v.right + d.right &&
                      l > v.top - d.top &&
                      l < v.bottom + d.bottom,
                  ) || m
                )
              if (f.length >= 2) {
                if (Ee(n) === 'y') {
                  let M = f[0],
                    B = f[f.length - 1],
                    U = G(n) === 'top',
                    u = M.top,
                    p = B.bottom,
                    _ = U ? M.left : B.left,
                    S = U ? M.right : B.right,
                    w = S - _,
                    R = p - u
                  return { top: u, bottom: p, left: _, right: S, width: w, height: R, x: _, y: u }
                }
                let v = G(n) === 'left',
                  x = V(...f.map((M) => M.right)),
                  E = Q(...f.map((M) => M.left)),
                  O = f.filter((M) => (v ? M.left === E : M.right === x)),
                  T = O[0].top,
                  P = O[O.length - 1].bottom,
                  j = E,
                  q = x,
                  Y = q - j,
                  $ = P - T
                return { top: T, bottom: P, left: j, right: q, width: Y, height: $, x: j, y: T }
              }
              return m
            }
            let h = await i.getElementRects({
              reference: { getBoundingClientRect: y },
              floating: r.floating,
              strategy: a,
            })
            return o.reference.x !== h.reference.x ||
              o.reference.y !== h.reference.y ||
              o.reference.width !== h.reference.width ||
              o.reference.height !== h.reference.height
              ? { reset: { rects: h } }
              : {}
          },
        }
      )
    }
    ;(Aa = function (e) {
      return (
        e === void 0 && (e = 0),
        {
          name: 'offset',
          options: e,
          async fn(t) {
            var n, r
            let { x: o, y: i, placement: a, middlewareData: c } = t,
              s = await Ra(t, e)
            return a === ((n = c.offset) == null ? void 0 : n.placement) &&
              (r = c.arrow) != null &&
              r.alignmentOffset
              ? {}
              : { x: o + s.x, y: i + s.y, data: { ...s, placement: a } }
          },
        }
      )
    }),
      (ho = function (e) {
        return (
          e === void 0 && (e = {}),
          {
            name: 'shift',
            options: e,
            async fn(t) {
              let { x: n, y: r, placement: o } = t,
                {
                  mainAxis: i = !0,
                  crossAxis: a = !1,
                  limiter: c = {
                    fn: (v) => {
                      let { x, y: E } = v
                      return { x, y: E }
                    },
                  },
                  ...s
                } = Z(e, t),
                l = { x: n, y: r },
                g = await Re(t, s),
                f = Ee(G(o)),
                m = bt(f),
                d = l[m],
                y = l[f]
              if (i) {
                let v = m === 'y' ? 'top' : 'left',
                  x = m === 'y' ? 'bottom' : 'right',
                  E = d + g[v],
                  O = d - g[x]
                d = vt(E, d, O)
              }
              if (a) {
                let v = f === 'y' ? 'top' : 'left',
                  x = f === 'y' ? 'bottom' : 'right',
                  E = y + g[v],
                  O = y - g[x]
                y = vt(E, y, O)
              }
              let h = c.fn({ ...t, [m]: d, [f]: y })
              return { ...h, data: { x: h.x - n, y: h.y - r } }
            },
          }
        )
      }),
      (vo = function (e) {
        return (
          e === void 0 && (e = {}),
          {
            options: e,
            fn(t) {
              let { x: n, y: r, placement: o, rects: i, middlewareData: a } = t,
                { offset: c = 0, mainAxis: s = !0, crossAxis: l = !0 } = Z(e, t),
                g = { x: n, y: r },
                f = Ee(o),
                m = bt(f),
                d = g[m],
                y = g[f],
                h = Z(c, t),
                v =
                  typeof h == 'number'
                    ? { mainAxis: h, crossAxis: 0 }
                    : { mainAxis: 0, crossAxis: 0, ...h }
              if (s) {
                let O = m === 'y' ? 'height' : 'width',
                  T = i.reference[m] - i.floating[O] + v.mainAxis,
                  P = i.reference[m] + i.reference[O] - v.mainAxis
                d < T ? (d = T) : d > P && (d = P)
              }
              if (l) {
                var x, E
                let O = m === 'y' ? 'width' : 'height',
                  T = ['top', 'left'].includes(G(o)),
                  P =
                    i.reference[f] -
                    i.floating[O] +
                    ((T && ((x = a.offset) == null ? void 0 : x[f])) || 0) +
                    (T ? 0 : v.crossAxis),
                  j =
                    i.reference[f] +
                    i.reference[O] +
                    (T ? 0 : ((E = a.offset) == null ? void 0 : E[f]) || 0) -
                    (T ? v.crossAxis : 0)
                y < P ? (y = P) : y > j && (y = j)
              }
              return { [m]: d, [f]: y }
            },
          }
        )
      }),
      (bo = function (e) {
        return (
          e === void 0 && (e = {}),
          {
            name: 'size',
            options: e,
            async fn(t) {
              let { placement: n, rects: r, platform: o, elements: i } = t,
                { apply: a = () => {}, ...c } = Z(e, t),
                s = await Re(t, c),
                l = G(n),
                g = ee(n),
                f = Ee(n) === 'y',
                { width: m, height: d } = r.floating,
                y,
                h
              l === 'top' || l === 'bottom'
                ? ((y = l),
                  (h =
                    g ===
                    ((await (o.isRTL == null ? void 0 : o.isRTL(i.floating))) ? 'start' : 'end')
                      ? 'left'
                      : 'right'))
                : ((h = l), (y = g === 'end' ? 'top' : 'bottom'))
              let v = d - s[y],
                x = m - s[h],
                E = !t.middlewareData.shift,
                O = v,
                T = x
              if (f) {
                let j = m - s.left - s.right
                T = g || E ? Q(x, j) : j
              } else {
                let j = d - s.top - s.bottom
                O = g || E ? Q(v, j) : j
              }
              if (E && !g) {
                let j = V(s.left, 0),
                  q = V(s.right, 0),
                  Y = V(s.top, 0),
                  $ = V(s.bottom, 0)
                f
                  ? (T = m - 2 * (j !== 0 || q !== 0 ? j + q : V(s.left, s.right)))
                  : (O = d - 2 * (Y !== 0 || $ !== 0 ? Y + $ : V(s.top, s.bottom)))
              }
              await a({ ...t, availableWidth: T, availableHeight: O })
              let P = await o.getDimensions(i.floating)
              return m !== P.width || d !== P.height ? { reset: { rects: !0 } } : {}
            },
          }
        )
      })
  })
function To(e) {
  let t = J(e),
    n = parseFloat(t.width) || 0,
    r = parseFloat(t.height) || 0,
    o = ve(e),
    i = o ? e.offsetWidth : n,
    a = o ? e.offsetHeight : r,
    c = Ve(n) !== i || Ve(r) !== a
  return c && ((n = i), (r = a)), { width: n, height: r, $: c }
}
function un(e) {
  return xe(e) ? e : e.contextElement
}
function Fe(e) {
  let t = un(e)
  if (!ve(t)) return Te(1)
  let n = t.getBoundingClientRect(),
    { width: r, height: o, $: i } = To(t),
    a = (i ? Ve(n.width) : n.width) / r,
    c = (i ? Ve(n.height) : n.height) / o
  return (
    (!a || !Number.isFinite(a)) && (a = 1), (!c || !Number.isFinite(c)) && (c = 1), { x: a, y: c }
  )
}
function _o(e) {
  let t = K(e)
  return !ht() || !t.visualViewport
    ? La
    : { x: t.visualViewport.offsetLeft, y: t.visualViewport.offsetTop }
}
function Ma(e, t, n) {
  return t === void 0 && (t = !1), !n || (t && n !== K(e)) ? !1 : t
}
function Ae(e, t, n, r) {
  t === void 0 && (t = !1), n === void 0 && (n = !1)
  let o = e.getBoundingClientRect(),
    i = un(e),
    a = Te(1)
  t && (r ? xe(r) && (a = Fe(r)) : (a = Fe(e)))
  let c = Ma(i, n, r) ? _o(i) : Te(0),
    s = (o.left + c.x) / a.x,
    l = (o.top + c.y) / a.y,
    g = o.width / a.x,
    f = o.height / a.y
  if (i) {
    let m = K(i),
      d = r && xe(r) ? K(r) : r,
      y = m,
      h = y.frameElement
    for (; h && r && d !== y; ) {
      let v = Fe(h),
        x = h.getBoundingClientRect(),
        E = J(h),
        O = x.left + (h.clientLeft + parseFloat(E.paddingLeft)) * v.x,
        T = x.top + (h.clientTop + parseFloat(E.paddingTop)) * v.y
      ;(s *= v.x),
        (l *= v.y),
        (g *= v.x),
        (f *= v.y),
        (s += O),
        (l += T),
        (y = K(h)),
        (h = y.frameElement)
    }
  }
  return _e({ width: g, height: f, x: s, y: l })
}
function So(e) {
  return ja.some((t) => {
    try {
      return e.matches(t)
    } catch {
      return !1
    }
  })
}
function ka(e) {
  let { elements: t, rect: n, offsetParent: r, strategy: o } = e,
    i = o === 'fixed',
    a = be(r),
    c = t ? So(t.floating) : !1
  if (r === a || (c && i)) return n
  let s = { scrollLeft: 0, scrollTop: 0 },
    l = Te(1),
    g = Te(0),
    f = ve(r)
  if ((f || (!f && !i)) && ((we(r) !== 'body' || Ne(a)) && (s = Ue(r)), ve(r))) {
    let m = Ae(r)
    ;(l = Fe(r)), (g.x = m.x + r.clientLeft), (g.y = m.y + r.clientTop)
  }
  return {
    width: n.width * l.x,
    height: n.height * l.y,
    x: n.x * l.x - s.scrollLeft * l.x + g.x,
    y: n.y * l.y - s.scrollTop * l.y + g.y,
  }
}
function Da(e) {
  return Array.from(e.getClientRects())
}
function Eo(e) {
  return Ae(be(e)).left + Ue(e).scrollLeft
}
function Na(e) {
  let t = be(e),
    n = Ue(e),
    r = e.ownerDocument.body,
    o = V(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth),
    i = V(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight),
    a = -n.scrollLeft + Eo(e),
    c = -n.scrollTop
  return (
    J(r).direction === 'rtl' && (a += V(t.clientWidth, r.clientWidth) - o),
    { width: o, height: i, x: a, y: c }
  )
}
function Fa(e, t) {
  let n = K(e),
    r = be(e),
    o = n.visualViewport,
    i = r.clientWidth,
    a = r.clientHeight,
    c = 0,
    s = 0
  if (o) {
    ;(i = o.width), (a = o.height)
    let l = ht()
    ;(!l || (l && t === 'fixed')) && ((c = o.offsetLeft), (s = o.offsetTop))
  }
  return { width: i, height: a, x: c, y: s }
}
function Ia(e, t) {
  let n = Ae(e, !0, t === 'fixed'),
    r = n.top + e.clientTop,
    o = n.left + e.clientLeft,
    i = ve(e) ? Fe(e) : Te(1),
    a = e.clientWidth * i.x,
    c = e.clientHeight * i.y,
    s = o * i.x,
    l = r * i.y
  return { width: a, height: c, x: s, y: l }
}
function xo(e, t, n) {
  let r
  if (t === 'viewport') r = Fa(e, n)
  else if (t === 'document') r = Na(be(e))
  else if (xe(t)) r = Ia(t, n)
  else {
    let o = _o(e)
    r = { ...t, x: t.x - o.x, y: t.y - o.y }
  }
  return _e(r)
}
function Oo(e, t) {
  let n = Pe(e)
  return n === t || !xe(n) || $e(n) ? !1 : J(n).position === 'fixed' || Oo(n, t)
}
function qa(e, t) {
  let n = t.get(e)
  if (n) return n
  let r = Ce(e, [], !1).filter((c) => xe(c) && we(c) !== 'body'),
    o = null,
    i = J(e).position === 'fixed',
    a = i ? Pe(e) : e
  for (; xe(a) && !$e(a); ) {
    let c = J(a),
      s = yt(a)
    !s && c.position === 'fixed' && (o = null),
      (
        i
          ? !s && !o
          : (!s && c.position === 'static' && !!o && ['absolute', 'fixed'].includes(o.position)) ||
            (Ne(a) && !s && Oo(e, a))
      )
        ? (r = r.filter((g) => g !== a))
        : (o = c),
      (a = Pe(a))
  }
  return t.set(e, r), r
}
function $a(e) {
  let { element: t, boundary: n, rootBoundary: r, strategy: o } = e,
    a = [...(n === 'clippingAncestors' ? qa(t, this._c) : [].concat(n)), r],
    c = a[0],
    s = a.reduce(
      (l, g) => {
        let f = xo(t, g, o)
        return (
          (l.top = V(f.top, l.top)),
          (l.right = Q(f.right, l.right)),
          (l.bottom = Q(f.bottom, l.bottom)),
          (l.left = V(f.left, l.left)),
          l
        )
      },
      xo(t, c, o),
    )
  return { width: s.right - s.left, height: s.bottom - s.top, x: s.left, y: s.top }
}
function Ua(e) {
  let { width: t, height: n } = To(e)
  return { width: t, height: n }
}
function Ba(e, t, n) {
  let r = ve(t),
    o = be(t),
    i = n === 'fixed',
    a = Ae(e, !0, i, t),
    c = { scrollLeft: 0, scrollTop: 0 },
    s = Te(0)
  if (r || (!r && !i))
    if (((we(t) !== 'body' || Ne(o)) && (c = Ue(t)), r)) {
      let f = Ae(t, !0, i, t)
      ;(s.x = f.x + t.clientLeft), (s.y = f.y + t.clientTop)
    } else o && (s.x = Eo(o))
  let l = a.left + c.scrollLeft - s.x,
    g = a.top + c.scrollTop - s.y
  return { x: l, y: g, width: a.width, height: a.height }
}
function wo(e, t) {
  return !ve(e) || J(e).position === 'fixed' ? null : t ? t(e) : e.offsetParent
}
function Po(e, t) {
  let n = K(e)
  if (!ve(e) || So(e)) return n
  let r = wo(e, t)
  for (; r && eo(r) && J(r).position === 'static'; ) r = wo(r, t)
  return r && (we(r) === 'html' || (we(r) === 'body' && J(r).position === 'static' && !yt(r)))
    ? n
    : r || to(e) || n
}
function Va(e) {
  return J(e).direction === 'rtl'
}
function za(e, t) {
  let n = null,
    r,
    o = be(e)
  function i() {
    var c
    clearTimeout(r), (c = n) == null || c.disconnect(), (n = null)
  }
  function a(c, s) {
    c === void 0 && (c = !1), s === void 0 && (s = 1), i()
    let { left: l, top: g, width: f, height: m } = e.getBoundingClientRect()
    if ((c || t(), !f || !m)) return
    let d = Ye(g),
      y = Ye(o.clientWidth - (l + f)),
      h = Ye(o.clientHeight - (g + m)),
      v = Ye(l),
      E = {
        rootMargin: -d + 'px ' + -y + 'px ' + -h + 'px ' + -v + 'px',
        threshold: V(0, Q(1, s)) || 1,
      },
      O = !0
    function T(P) {
      let j = P[0].intersectionRatio
      if (j !== s) {
        if (!O) return a()
        j
          ? a(!1, j)
          : (r = setTimeout(() => {
              a(!1, 1e-7)
            }, 100))
      }
      O = !1
    }
    try {
      n = new IntersectionObserver(T, { ...E, root: o.ownerDocument })
    } catch {
      n = new IntersectionObserver(T, E)
    }
    n.observe(e)
  }
  return a(!0), i
}
function rc(e, t, n, r) {
  r === void 0 && (r = {})
  let {
      ancestorScroll: o = !0,
      ancestorResize: i = !0,
      elementResize: a = typeof ResizeObserver == 'function',
      layoutShift: c = typeof IntersectionObserver == 'function',
      animationFrame: s = !1,
    } = r,
    l = un(e),
    g = o || i ? [...(l ? Ce(l) : []), ...Ce(t)] : []
  g.forEach((x) => {
    o && x.addEventListener('scroll', n, { passive: !0 }), i && x.addEventListener('resize', n)
  })
  let f = l && c ? za(l, n) : null,
    m = -1,
    d = null
  a &&
    ((d = new ResizeObserver((x) => {
      let [E] = x
      E &&
        E.target === l &&
        d &&
        (d.unobserve(t),
        cancelAnimationFrame(m),
        (m = requestAnimationFrame(() => {
          var O
          ;(O = d) == null || O.observe(t)
        }))),
        n()
    })),
    l && !s && d.observe(l),
    d.observe(t))
  let y,
    h = s ? Ae(e) : null
  s && v()
  function v() {
    let x = Ae(e)
    h && (x.x !== h.x || x.y !== h.y || x.width !== h.width || x.height !== h.height) && n(),
      (h = x),
      (y = requestAnimationFrame(v))
  }
  return (
    n(),
    () => {
      var x
      g.forEach((E) => {
        o && E.removeEventListener('scroll', n), i && E.removeEventListener('resize', n)
      }),
        f?.(),
        (x = d) == null || x.disconnect(),
        (d = null),
        s && cancelAnimationFrame(y)
    }
  )
}
var La,
  ja,
  Wa,
  Ya,
  oc,
  ic,
  ac,
  sc,
  cc,
  lc,
  uc,
  fc,
  dc,
  Ha = Ke(() => {
    ln()
    ln()
    _t()
    on()
    on()
    La = Te(0)
    ja = [':popover-open', ':modal']
    Wa = async function (e) {
      let t = this.getOffsetParent || Po,
        n = this.getDimensions
      return {
        reference: Ba(e.reference, await t(e.floating), e.strategy),
        floating: { x: 0, y: 0, ...(await n(e.floating)) },
      }
    }
    Ya = {
      convertOffsetParentRelativeRectToViewportRelativeRect: ka,
      getDocumentElement: be,
      getClippingRect: $a,
      getOffsetParent: Po,
      getElementRects: Wa,
      getClientRects: Da,
      getDimensions: Ua,
      getScale: Fe,
      isElement: xe,
      isRTL: Va,
    }
    ;(oc = fo),
      (ic = ho),
      (ac = po),
      (sc = bo),
      (cc = go),
      (lc = uo),
      (uc = yo),
      (fc = vo),
      (dc = (e, t, n) => {
        let r = new Map(),
          o = { platform: Ya, ...n },
          i = { ...o.platform, _c: r }
        return lo(e, t, { ...o, platform: i })
      })
  })
import Et from 'react'
import './index.scss'
var Xa = ({ className: e }) =>
  Et.createElement(
    'svg',
    {
      className: [e, 'icon icon--x'].filter(Boolean).join(' '),
      height: '25',
      viewBox: '0 0 25 25',
      width: '25',
      xmlns: 'http://www.w3.org/2000/svg',
    },
    Et.createElement('line', {
      className: 'stroke',
      x1: '8.74612',
      x2: '16.3973',
      y1: '16.347',
      y2: '8.69584',
    }),
    Et.createElement('line', {
      className: 'stroke',
      x1: '8.6027',
      x2: '16.2539',
      y1: '8.69585',
      y2: '16.3471',
    }),
  )
var tt = jo(wr(), 1)
import Ki, {
  createContext as Gi,
  useCallback as Xi,
  useContext as Ji,
  useEffect as Qi,
} from 'react'
var Tr = Gi({ clearRouteCache: () => {} }),
  us = ({ children: e }) => {
    let t = (0, tt.usePathname)(),
      n = (0, tt.useRouter)(),
      r = Xi(() => {
        n.refresh()
      }, [n])
    return (
      Qi(() => {
        r()
      }, [t, r]),
      Ki.createElement(Tr.Provider, { value: { clearRouteCache: r } }, e)
    )
  },
  _r = () => Ji(Tr)
var qe = async (e) => {
  let t
  switch (e) {
    case 'ar':
      t = await import('./ar-HY2DZD74.js')
      break
    case 'az':
      t = await import('./az-5JRANPRT.js')
      break
    case 'bg':
      t = await import('./bg-LHDOUOB5.js')
      break
    case 'cs':
      t = await import('./cs-FEZXQFNK.js')
      break
    case 'de':
      t = await import('./de-J2BMEE7J.js')
      break
    case 'en-US':
      t = await import('./en-US-P6K2FYH2.js')
      break
    case 'es':
      t = await import('./es-QWIOWJF3.js')
      break
    case 'fa-IR':
      t = await import('./fa-IR-E6HIJ75W.js')
      break
    case 'fr':
      t = await import('./fr-M3RU6HQO.js')
      break
    case 'he':
      t = await import('./he-JVK2TVUR.js')
      break
    case 'hr':
      t = await import('./hr-U6CTFMBV.js')
      break
    case 'hu':
      t = await import('./hu-YQD6SZNU.js')
      break
    case 'it':
      t = await import('./it-4PLRZWEG.js')
      break
    case 'ja':
      t = await import('./ja-L5BF3WDP.js')
      break
    case 'ko':
      t = await import('./ko-YDG2QX3E.js')
      break
    case 'nb':
      t = await import('./nb-E45D4NPY.js')
      break
    case 'nl':
      t = await import('./nl-FHP6I3W4.js')
      break
    case 'pl':
      t = await import('./pl-3KI6TAXJ.js')
      break
    case 'pt':
      t = await import('./pt-OJNXV6VN.js')
      break
    case 'ro':
      t = await import('./ro-USXJ6OOV.js')
      break
    case 'ru':
      t = await import('./ru-EB6QMNGI.js')
      break
    case 'sk':
      t = await import('./sk-WZFYVWEJ.js')
      break
    case 'sv':
      t = await import('./sv-M2TDVPPH.js')
      break
    case 'th':
      t = await import('./th-OPMP65GZ.js')
      break
    case 'tr':
      t = await import('./tr-JNQGMAG3.js')
      break
    case 'uk':
      t = await import('./uk-YP4ZHGRP.js')
      break
    case 'vi':
      t = await import('./vi-3C25CHV3.js')
      break
    case 'zh-CN':
      t = await import('./zh-CN-WI5TML7L.js')
      break
    case 'zh-TW':
      t = await import('./zh-TW-VV7627HM.js')
      break
  }
  return t.default ? t.default : t
}
var Zi = (e, t) => {
  if (typeof e == 'object' && !Object.prototype.hasOwnProperty.call(e, '$$typeof')) {
    if (e[t.language]) return e[t.language]
    let n = []
    typeof t.fallbackLanguage == 'string'
      ? (n = [t.fallbackLanguage])
      : Array.isArray(t.fallbackLanguage) && (n = t.fallbackLanguage)
    let r = n.find((o) => e[o])
    return r && e[r] ? r : e[Object.keys(e)[0]]
  }
  return typeof e == 'function' ? e({ t: t.t }) : e
}
function Kt(e, t, n = !0) {
  let r = { ...e }
  for (let o in t)
    if (Object.prototype.hasOwnProperty.call(t, o)) {
      if (n && (t[o] === null || t[o] === void 0) && e[o] !== null && e[o] !== void 0) continue
      typeof t[o] == 'object' && e[o] ? (r[o] = Kt(e[o], t[o], n)) : (r[o] = t[o])
    }
  return r
}
var Sr = [
  'authentication:account',
  'authentication:accountOfCurrentUser',
  'authentication:alreadyActivated',
  'authentication:alreadyLoggedIn',
  'authentication:authenticated',
  'authentication:backToLogin',
  'authentication:beginCreateFirstUser',
  'authentication:changePassword',
  'authentication:checkYourEmailForPasswordReset',
  'authentication:confirmGeneration',
  'authentication:confirmPassword',
  'authentication:createFirstUser',
  'authentication:emailNotValid',
  'authentication:emailSent',
  'authentication:emailVerified',
  'authentication:enableAPIKey',
  'authentication:failedToUnlock',
  'authentication:forceUnlock',
  'authentication:forgotPassword',
  'authentication:forgotPasswordEmailInstructions',
  'authentication:forgotPasswordQuestion',
  'authentication:generate',
  'authentication:generateNewAPIKey',
  'authentication:generatingNewAPIKeyWillInvalidate',
  'authentication:logBackIn',
  'authentication:loggedOutInactivity',
  'authentication:loggedOutSuccessfully',
  'authentication:loggingOut',
  'authentication:login',
  'authentication:logOut',
  'authentication:loggedIn',
  'authentication:loggedInChangePassword',
  'authentication:logout',
  'authentication:logoutUser',
  'authentication:logoutSuccessful',
  'authentication:newAPIKeyGenerated',
  'authentication:newPassword',
  'authentication:passed',
  'authentication:passwordResetSuccessfully',
  'authentication:resetPassword',
  'authentication:stayLoggedIn',
  'authentication:successfullyRegisteredFirstUser',
  'authentication:successfullyUnlocked',
  'authentication:unableToVerify',
  'authentication:tokenRefreshSuccessful',
  'authentication:verified',
  'authentication:verifiedSuccessfully',
  'authentication:verify',
  'authentication:verifyUser',
  'authentication:youAreInactive',
  'error:autosaving',
  'error:correctInvalidFields',
  'error:deletingTitle',
  'error:loadingDocument',
  'error:logoutFailed',
  'error:noMatchedField',
  'error:notAllowedToAccessPage',
  'error:previewing',
  'error:unableToDeleteCount',
  'error:unableToUpdateCount',
  'error:unauthorized',
  'error:unknown',
  'error:unspecific',
  'error:userEmailAlreadyRegistered',
  'error:tokenNotProvided',
  'error:unPublishingDocument',
  'fields:addLabel',
  'fields:addLink',
  'fields:addNew',
  'fields:addNewLabel',
  'fields:addRelationship',
  'fields:addUpload',
  'fields:block',
  'fields:blocks',
  'fields:blockType',
  'fields:chooseBetweenCustomTextOrDocument',
  'fields:customURL',
  'fields:chooseDocumentToLink',
  'fields:openInNewTab',
  'fields:enterURL',
  'fields:internalLink',
  'fields:chooseFromExisting',
  'fields:linkType',
  'fields:textToDisplay',
  'fields:collapseAll',
  'fields:editLink',
  'fields:editRelationship',
  'fields:itemsAndMore',
  'fields:labelRelationship',
  'fields:latitude',
  'fields:linkedTo',
  'fields:longitude',
  'fields:passwordsDoNotMatch',
  'fields:removeRelationship',
  'fields:removeUpload',
  'fields:saveChanges',
  'fields:searchForBlock',
  'fields:selectFieldsToEdit',
  'fields:showAll',
  'fields:swapRelationship',
  'fields:swapUpload',
  'fields:toggleBlock',
  'fields:uploadNewLabel',
  'general:aboutToDeleteCount',
  'general:aboutToDelete',
  'general:addBelow',
  'general:addFilter',
  'general:adminTheme',
  'general:and',
  'general:applyChanges',
  'general:ascending',
  'general:automatic',
  'general:backToDashboard',
  'general:cancel',
  'general:changesNotSaved',
  'general:close',
  'general:collapse',
  'general:collections',
  'general:columns',
  'general:columnToSort',
  'general:confirm',
  'general:confirmDeletion',
  'general:confirmDuplication',
  'general:copied',
  'general:copy',
  'general:create',
  'general:created',
  'general:createdAt',
  'general:createNew',
  'general:createNewLabel',
  'general:creating',
  'general:creatingNewLabel',
  'general:custom',
  'general:dark',
  'general:dashboard',
  'general:delete',
  'general:deletedSuccessfully',
  'general:deletedCountSuccessfully',
  'general:deleting',
  'general:descending',
  'general:depth',
  'general:deselectAllRows',
  'general:document',
  'general:documents',
  'general:duplicate',
  'general:duplicateWithoutSaving',
  'general:edit',
  'general:editing',
  'general:editingLabel',
  'general:editLabel',
  'general:email',
  'general:emailAddress',
  'general:enterAValue',
  'general:error',
  'general:errors',
  'general:fallbackToDefaultLocale',
  'general:false',
  'general:filters',
  'general:filterWhere',
  'general:globals',
  'general:language',
  'general:lastModified',
  'general:leaveAnyway',
  'general:leaveWithoutSaving',
  'general:light',
  'general:livePreview',
  'general:loading',
  'general:locale',
  'general:menu',
  'general:moveDown',
  'general:moveUp',
  'general:noFiltersSet',
  'general:noLabel',
  'general:none',
  'general:noOptions',
  'general:noResults',
  'general:notFound',
  'general:nothingFound',
  'general:noValue',
  'general:of',
  'general:open',
  'general:or',
  'general:order',
  'general:pageNotFound',
  'general:password',
  'general:payloadSettings',
  'general:perPage',
  'general:remove',
  'general:reset',
  'general:row',
  'general:rows',
  'general:save',
  'general:saving',
  'general:searchBy',
  'general:selectAll',
  'general:selectAllRows',
  'general:selectedCount',
  'general:selectValue',
  'general:showAllLabel',
  'general:sorryNotFound',
  'general:sort',
  'general:sortByLabelDirection',
  'general:stayOnThisPage',
  'general:submissionSuccessful',
  'general:submit',
  'general:success',
  'general:successfullyCreated',
  'general:successfullyDuplicated',
  'general:thisLanguage',
  'general:titleDeleted',
  'general:true',
  'general:users',
  'general:user',
  'general:unauthorized',
  'general:unsavedChangesDuplicate',
  'general:untitled',
  'general:updatedAt',
  'general:updatedCountSuccessfully',
  'general:updatedSuccessfully',
  'general:updating',
  'general:welcome',
  'operators:equals',
  'operators:exists',
  'operators:isNotIn',
  'operators:isIn',
  'operators:contains',
  'operators:isLike',
  'operators:isNotEqualTo',
  'operators:near',
  'operators:isGreaterThan',
  'operators:isLessThan',
  'operators:isGreaterThanOrEqualTo',
  'operators:isLessThanOrEqualTo',
  'upload:crop',
  'upload:cropToolDescription',
  'upload:dragAndDrop',
  'upload:editImage',
  'upload:focalPoint',
  'upload:focalPointDescription',
  'upload:height',
  'upload:previewSizes',
  'upload:selectCollectionToBrowse',
  'upload:selectFile',
  'upload:setCropArea',
  'upload:setFocalPoint',
  'upload:sizesFor',
  'upload:sizes',
  'upload:width',
  'upload:fileName',
  'upload:fileSize',
  'validation:emailAddress',
  'validation:fieldHasNo',
  'validation:limitReached',
  'validation:longerThanMin',
  'validation:required',
  'validation:requiresAtLeast',
  'validation:shorterThanMax',
  'version:aboutToPublishSelection',
  'version:aboutToRestore',
  'version:aboutToRestoreGlobal',
  'version:aboutToRevertToPublished',
  'version:aboutToUnpublish',
  'version:aboutToUnpublishSelection',
  'version:autosave',
  'version:autosavedSuccessfully',
  'version:autosavedVersion',
  'version:changed',
  'version:confirmRevertToSaved',
  'version:compareVersion',
  'version:confirmPublish',
  'version:confirmUnpublish',
  'version:confirmVersionRestoration',
  'version:draft',
  'version:draftSavedSuccessfully',
  'version:lastSavedAgo',
  'version:noFurtherVersionsFound',
  'version:noRowsFound',
  'version:preview',
  'version:problemRestoringVersion',
  'version:publish',
  'version:publishChanges',
  'version:published',
  'version:publishing',
  'version:restoredSuccessfully',
  'version:restoreThisVersion',
  'version:restoring',
  'version:reverting',
  'version:revertToPublished',
  'version:saveDraft',
  'version:selectLocales',
  'version:selectVersionToCompare',
  'version:showLocales',
  'version:status',
  'version:type',
  'version:unpublish',
  'version:unpublishing',
  'version:versionCreatedOn',
  'version:versionID',
  'version:version',
  'version:versions',
  'version:viewingVersion',
  'version:viewingVersionGlobal',
  'version:viewingVersions',
  'version:viewingVersionsGlobal',
]
function Er(e, t = '', n) {
  let r = {}
  for (let [o, i] of Object.entries(e)) {
    if (o === '$schema') {
      r[o] = i
      continue
    }
    if (typeof i == 'object') {
      let a = Er(i, o, n)
      Object.keys(a).length > 0 && (r[o] = a)
    } else
      for (let a of n) {
        let [c, s] = a.split(':')
        t === c &&
          (o === s
            ? (r[s] = i)
            : ['zero', 'one', 'two', 'few', 'many', 'other'].forEach((g) => {
                o === `${s}_${g}` && (r[`${s}_${g}`] = i)
              }))
      }
  }
  return r
}
function Or(e) {
  let t = {}
  return (
    Object.keys(e)
      .sort()
      .forEach((n) => {
        typeof e[n] == 'object' ? (t[n] = Or(e[n])) : (t[n] = e[n])
      }),
    t
  )
}
var Pr = (e, t) => (t === 'client' ? Or(Er(e.translations, '', Sr)) : e.translations)
var ea = ({ count: e, key: t, translations: n }) => {
    let r = t.split(':'),
      o = '',
      i = r.reduce((a, c, s) => {
        if (typeof a == 'string') return a
        typeof e == 'number' &&
          (e === 0 && `${c}_zero` in a
            ? (o = '_zero')
            : e === 1 && `${c}_one` in a
              ? (o = '_one')
              : e === 2 && `${c}_two` in a
                ? (o = '_two')
                : e > 5 && `${c}_many` in a
                  ? (o = '_many')
                  : e > 2 && e <= 5 && `${c}_few` in a
                    ? (o = '_few')
                    : `${c}_other` in a && (o = '_other'))
        let l = c
        if ((s === r.length - 1 && o && (l = `${c}${o}`), a && l in a)) return a[l]
      }, n)
    return i || console.log('key not found:', t), i || t
  },
  ta = ({ translationString: e, vars: t }) =>
    e
      .split(/(\{\{.*?\}\})/)
      .map((r) => {
        if (r.startsWith('{{') && r.endsWith('}}')) {
          let o = r.substring(2, r.length - 2).trim(),
            i = t[o]
          return i ?? r
        } else return r
      })
      .join('')
function nt({ key: e, translations: t, vars: n }) {
  let r = ea({ count: typeof n?.count == 'number' ? n.count : void 0, key: e, translations: t })
  return n && (r = ta({ translationString: r, vars: n })), r || (r = e), r
}
var na = (e) => {
  let { config: t, language: n, translations: r } = e,
    o = Kt(r, t?.translations?.[n] ?? {})
  return { t: (i, a) => nt({ key: i, translations: o, vars: a }), translations: o }
}
function ra(e, t) {
  let n = new Map()
  return async (o) => {
    let i = t.reduce((a, c) => a + o[c], '')
    if (!n.has(i)) {
      let a = await e(o)
      n.set(i, a)
    }
    return n.get(i)
  }
}
var oa = ra(
  async ({ config: e, context: t, language: n = e.fallbackLanguage }) => {
    let r = Pr(e.supportedLanguages[n], t),
      { t: o, translations: i } = na({
        config: e,
        language: n || e.fallbackLanguage,
        translations: r,
      }),
      a = e.supportedLanguages[n]?.dateFNSKey || 'en-US'
    return {
      dateFNS: await qe(a),
      dateFNSKey: a,
      fallbackLanguage: e.fallbackLanguage,
      language: n || e.fallbackLanguage,
      t: o,
      translations: i,
    }
  },
  ['language', 'context'],
)
import Cr, { createContext as ia, useContext as aa, useEffect as sa, useState as ca } from 'react'
var Rr = ia({
    i18n: {
      dateFNS: dn,
      dateFNSKey: 'en-US',
      fallbackLanguage: 'en',
      language: 'en',
      t: (e) => e,
      translations: {},
    },
    languageOptions: void 0,
    switchLanguage: void 0,
    t: (e) => {},
  }),
  Ns = ({
    children: e,
    dateFNSKey: t,
    fallbackLang: n,
    language: r,
    languageOptions: o,
    switchLanguageServerAction: i,
    translations: a,
  }) => {
    let { clearRouteCache: c } = _r(),
      [s, l] = ca(),
      g = (m, d) => nt({ key: m, translations: a, vars: d }),
      f = Cr.useCallback(
        async (m) => {
          try {
            await i(m), c()
          } catch (d) {
            console.error(`Error loading language: "${m}"`, d)
          }
        },
        [i, c],
      )
    return (
      sa(() => {
        ;(async () => {
          let d = await qe(t)
          l(d)
        })()
      }, [t]),
      Cr.createElement(
        Rr.Provider,
        {
          value: {
            i18n: {
              dateFNS: s,
              dateFNSKey: t,
              fallbackLanguage: n,
              language: r,
              t: g,
              translations: a,
            },
            languageOptions: o,
            switchLanguage: f,
            t: g,
          },
        },
        e,
      )
    )
  },
  Fs = () => aa(Rr)
export {
  Zt as a,
  Ta as b,
  Zi as c,
  pn as d,
  vn as e,
  En as f,
  rr as g,
  wr as h,
  Xa as i,
  us as j,
  _r as k,
  Ns as l,
  Fs as m,
  we as n,
  K as o,
  xe as p,
  ve as q,
  Qr as r,
  $e as s,
  J as t,
  Pe as u,
  Ce as v,
  on as w,
  Ye as x,
  _t as y,
  Re as z,
  Aa as A,
  Ya as B,
  rc as C,
  oc as D,
  ic as E,
  ac as F,
  sc as G,
  cc as H,
  lc as I,
  uc as J,
  fc as K,
  dc as L,
  Ha as M,
}
/*! Bundled license information:

react-is/cjs/react-is.production.min.js:
  (** @license React v16.13.1
   * react-is.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-is/cjs/react-is.development.js:
  (** @license React v16.13.1
   * react-is.development.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

object-assign/index.js:
  (*
  object-assign
  (c) Sindre Sorhus
  @license MIT
  *)
*/
