'use client'
import { b as Pe, f as Se } from './chunk-ROIGO7FK.js'
import { a as P, c as w, e as lt } from './chunk-DGJUBN33.js'
var ae = w((M) => {
  'use strict'
  Object.defineProperty(M, '__esModule', { value: !0 })
  function qe(e, t, r) {
    return (
      t in e
        ? Object.defineProperty(e, t, { value: r, enumerable: !0, configurable: !0, writable: !0 })
        : (e[t] = r),
      e
    )
  }
  function Ee(e, t) {
    var r = Object.keys(e)
    if (Object.getOwnPropertySymbols) {
      var n = Object.getOwnPropertySymbols(e)
      t &&
        (n = n.filter(function (i) {
          return Object.getOwnPropertyDescriptor(e, i).enumerable
        })),
        r.push.apply(r, n)
    }
    return r
  }
  function st(e) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t] != null ? arguments[t] : {}
      t % 2
        ? Ee(Object(r), !0).forEach(function (n) {
            qe(e, n, r[n])
          })
        : Object.getOwnPropertyDescriptors
          ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
          : Ee(Object(r)).forEach(function (n) {
              Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n))
            })
    }
    return e
  }
  function Ie(e, t) {
    if (e == null) return {}
    var r = {},
      n = Object.keys(e),
      i,
      o
    for (o = 0; o < n.length; o++) (i = n[o]), !(t.indexOf(i) >= 0) && (r[i] = e[i])
    return r
  }
  function ft(e, t) {
    if (e == null) return {}
    var r = Ie(e, t),
      n,
      i
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e)
      for (i = 0; i < o.length; i++)
        (n = o[i]),
          !(t.indexOf(n) >= 0) && Object.prototype.propertyIsEnumerable.call(e, n) && (r[n] = e[n])
    }
    return r
  }
  function dt(e, t) {
    return _e(e) || Re(e, t) || Te(e, t) || Ae()
  }
  function _e(e) {
    if (Array.isArray(e)) return e
  }
  function Re(e, t) {
    if (!(typeof Symbol > 'u' || !(Symbol.iterator in Object(e)))) {
      var r = [],
        n = !0,
        i = !1,
        o = void 0
      try {
        for (
          var a = e[Symbol.iterator](), s;
          !(n = (s = a.next()).done) && (r.push(s.value), !(t && r.length === t));
          n = !0
        );
      } catch (f) {
        ;(i = !0), (o = f)
      } finally {
        try {
          !n && a.return != null && a.return()
        } finally {
          if (i) throw o
        }
      }
      return r
    }
  }
  function Te(e, t) {
    if (e) {
      if (typeof e == 'string') return oe(e, t)
      var r = Object.prototype.toString.call(e).slice(8, -1)
      if ((r === 'Object' && e.constructor && (r = e.constructor.name), r === 'Map' || r === 'Set'))
        return Array.from(e)
      if (r === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return oe(e, t)
    }
  }
  function oe(e, t) {
    ;(t == null || t > e.length) && (t = e.length)
    for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r]
    return n
  }
  function Ae() {
    throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)
  }
  M.arrayLikeToArray = oe
  M.arrayWithHoles = _e
  M.defineProperty = qe
  M.iterableToArrayLimit = Re
  M.nonIterableRest = Ae
  M.objectSpread2 = st
  M.objectWithoutProperties = ft
  M.objectWithoutPropertiesLoose = Ie
  M.slicedToArray = dt
  M.unsupportedIterableToArray = Te
})
var xe = w(($r, De) => {
  'use strict'
  function pt(e, t, r) {
    return (
      t in e
        ? Object.defineProperty(e, t, { value: r, enumerable: !0, configurable: !0, writable: !0 })
        : (e[t] = r),
      e
    )
  }
  function Le(e, t) {
    var r = Object.keys(e)
    if (Object.getOwnPropertySymbols) {
      var n = Object.getOwnPropertySymbols(e)
      t &&
        (n = n.filter(function (i) {
          return Object.getOwnPropertyDescriptor(e, i).enumerable
        })),
        r.push.apply(r, n)
    }
    return r
  }
  function Ce(e) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t] != null ? arguments[t] : {}
      t % 2
        ? Le(Object(r), !0).forEach(function (n) {
            pt(e, n, r[n])
          })
        : Object.getOwnPropertyDescriptors
          ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r))
          : Le(Object(r)).forEach(function (n) {
              Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n))
            })
    }
    return e
  }
  function gt() {
    for (var e = arguments.length, t = new Array(e), r = 0; r < e; r++) t[r] = arguments[r]
    return function (n) {
      return t.reduceRight(function (i, o) {
        return o(i)
      }, n)
    }
  }
  function x(e) {
    return function t() {
      for (var r = this, n = arguments.length, i = new Array(n), o = 0; o < n; o++)
        i[o] = arguments[o]
      return i.length >= e.length
        ? e.apply(this, i)
        : function () {
            for (var a = arguments.length, s = new Array(a), f = 0; f < a; f++) s[f] = arguments[f]
            return t.apply(r, [].concat(i, s))
          }
    }
  }
  function B(e) {
    return {}.toString.call(e).includes('Object')
  }
  function vt(e) {
    return !Object.keys(e).length
  }
  function N(e) {
    return typeof e == 'function'
  }
  function mt(e, t) {
    return Object.prototype.hasOwnProperty.call(e, t)
  }
  function ht(e, t) {
    return (
      B(t) || q('changeType'),
      Object.keys(t).some(function (r) {
        return !mt(e, r)
      }) && q('changeField'),
      t
    )
  }
  function bt(e) {
    N(e) || q('selectorType')
  }
  function yt(e) {
    N(e) || B(e) || q('handlerType'),
      B(e) &&
        Object.values(e).some(function (t) {
          return !N(t)
        }) &&
        q('handlersType')
  }
  function Ot(e) {
    e || q('initialIsRequired'), B(e) || q('initialType'), vt(e) && q('initialContent')
  }
  function jt(e, t) {
    throw new Error(e[t] || e.default)
  }
  var wt = {
      initialIsRequired: 'initial state is required',
      initialType: 'initial state should be an object',
      initialContent: "initial state shouldn't be an empty object",
      handlerType: 'handler should be an object or a function',
      handlersType: 'all handlers should be a functions',
      selectorType: 'selector should be a function',
      changeType: 'provided value of changes should be an object',
      changeField:
        'it seams you want to change a field in the state which is not specified in the "initial" state',
      default: 'an unknown error accured in `state-local` package',
    },
    q = x(jt)(wt),
    $ = { changes: ht, selector: bt, handler: yt, initial: Ot }
  function Mt(e) {
    var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}
    $.initial(e), $.handler(t)
    var r = { current: e },
      n = x(Et)(r, t),
      i = x(St)(r),
      o = x($.changes)(e),
      a = x(Pt)(r)
    function s() {
      var b =
        arguments.length > 0 && arguments[0] !== void 0
          ? arguments[0]
          : function (_) {
              return _
            }
      return $.selector(b), b(r.current)
    }
    function f(b) {
      gt(n, i, o, a)(b)
    }
    return [s, f]
  }
  function Pt(e, t) {
    return N(t) ? t(e.current) : t
  }
  function St(e, t) {
    return (e.current = Ce(Ce({}, e.current), t)), t
  }
  function Et(e, t, r) {
    return (
      N(t)
        ? t(e.current)
        : Object.keys(r).forEach(function (n) {
            var i
            return (i = t[n]) === null || i === void 0 ? void 0 : i.call(t, e.current[n])
          }),
      r
    )
  }
  var qt = { create: Mt }
  De.exports = qt
})
var Ne = w((ue) => {
  'use strict'
  Object.defineProperty(ue, '__esModule', { value: !0 })
  var It = { paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs' } }
  ue.default = It
})
var Ve = w((ce) => {
  'use strict'
  Object.defineProperty(ce, '__esModule', { value: !0 })
  function _t(e) {
    return function t() {
      for (var r = this, n = arguments.length, i = new Array(n), o = 0; o < n; o++)
        i[o] = arguments[o]
      return i.length >= e.length
        ? e.apply(this, i)
        : function () {
            for (var a = arguments.length, s = new Array(a), f = 0; f < a; f++) s[f] = arguments[f]
            return t.apply(r, [].concat(i, s))
          }
    }
  }
  ce.default = _t
})
var We = w((le) => {
  'use strict'
  Object.defineProperty(le, '__esModule', { value: !0 })
  function Rt(e) {
    return {}.toString.call(e).includes('Object')
  }
  le.default = Rt
})
var ze = w((V) => {
  'use strict'
  Object.defineProperty(V, '__esModule', { value: !0 })
  var Tt = Ve(),
    At = We()
  function Lt(e) {
    return (
      e || se('configIsRequired'),
      At.default(e) || se('configType'),
      e.urls ? (Ct(), { paths: { vs: e.urls.monacoBase } }) : e
    )
  }
  function Ct() {
    console.warn(fe.deprecation)
  }
  function Dt(e, t) {
    throw new Error(e[t] || e.default)
  }
  var fe = {
      configIsRequired: 'the configuration object is required',
      configType: 'the configuration object should be an object',
      default: 'an unknown error accured in `@monaco-editor/loader` package',
      deprecation: `Deprecation warning!
    You are using deprecated way of configuration.

    Instead of using
      monaco.config({ urls: { monacoBase: '...' } })
    use
      monaco.config({ paths: { vs: '...' } })

    For more please check the link https://github.com/suren-atoyan/monaco-loader#config
  `,
    },
    se = Tt.default(Dt)(fe),
    xt = { config: Lt }
  V.default = xt
  V.errorHandler = se
  V.errorMessages = fe
})
var He = w((de) => {
  'use strict'
  Object.defineProperty(de, '__esModule', { value: !0 })
  var Nt = function () {
    for (var t = arguments.length, r = new Array(t), n = 0; n < t; n++) r[n] = arguments[n]
    return function (i) {
      return r.reduceRight(function (o, a) {
        return a(o)
      }, i)
    }
  }
  de.default = Nt
})
var $e = w((pe) => {
  'use strict'
  Object.defineProperty(pe, '__esModule', { value: !0 })
  var Fe = ae()
  function ke(e, t) {
    return (
      Object.keys(t).forEach(function (r) {
        t[r] instanceof Object && e[r] && Object.assign(t[r], ke(e[r], t[r]))
      }),
      Fe.objectSpread2(Fe.objectSpread2({}, e), t)
    )
  }
  pe.default = ke
})
var Ue = w((U) => {
  'use strict'
  Object.defineProperty(U, '__esModule', { value: !0 })
  var Be = { type: 'cancelation', msg: 'operation is manually canceled' }
  function Vt(e) {
    var t = !1,
      r = new Promise(function (n, i) {
        e.then(function (o) {
          return t ? i(Be) : n(o)
        }),
          e.catch(i)
      })
    return (
      (r.cancel = function () {
        return (t = !0)
      }),
      r
    )
  }
  U.CANCELATION_MESSAGE = Be
  U.default = Vt
})
var Qe = w((me) => {
  'use strict'
  Object.defineProperty(me, '__esModule', { value: !0 })
  var Ge = ae(),
    Wt = xe(),
    zt = Ne(),
    Ht = ze(),
    Ft = He(),
    kt = $e(),
    ge = Ue()
  function $t(e) {
    return e && typeof e == 'object' && 'default' in e ? e : { default: e }
  }
  var Bt = $t(Wt),
    Ut = Bt.default.create({
      config: zt.default,
      isInitialized: !1,
      resolve: null,
      reject: null,
      monaco: null,
    }),
    Ke = Ge.slicedToArray(Ut, 2),
    W = Ke[0],
    G = Ke[1]
  function Gt(e) {
    var t = Ht.default.config(e),
      r = t.monaco,
      n = Ge.objectWithoutProperties(t, ['monaco'])
    G(function (i) {
      return { config: kt.default(i.config, n), monaco: r }
    })
  }
  function Kt() {
    var e = W(function (t) {
      var r = t.monaco,
        n = t.isInitialized,
        i = t.resolve
      return { monaco: r, isInitialized: n, resolve: i }
    })
    if (!e.isInitialized) {
      if ((G({ isInitialized: !0 }), e.monaco)) return e.resolve(e.monaco), ge.default(ve)
      if (window.monaco && window.monaco.editor)
        return Ye(window.monaco), e.resolve(window.monaco), ge.default(ve)
      Ft.default(Yt, Xt)(Zt)
    }
    return ge.default(ve)
  }
  function Yt(e) {
    return document.body.appendChild(e)
  }
  function Qt(e) {
    var t = document.createElement('script')
    return e && (t.src = e), t
  }
  function Xt(e) {
    var t = W(function (n) {
        var i = n.config,
          o = n.reject
        return { config: i, reject: o }
      }),
      r = Qt(''.concat(t.config.paths.vs, '/loader.js'))
    return (
      (r.onload = function () {
        return e()
      }),
      (r.onerror = t.reject),
      r
    )
  }
  function Zt() {
    var e = W(function (r) {
        var n = r.config,
          i = r.resolve,
          o = r.reject
        return { config: n, resolve: i, reject: o }
      }),
      t = window.require
    t.config(e.config),
      t(
        ['vs/editor/editor.main'],
        function (r) {
          Ye(r), e.resolve(r)
        },
        function (r) {
          e.reject(r)
        },
      )
  }
  function Ye(e) {
    W().monaco || G({ monaco: e })
  }
  function Jt() {
    return W(function (e) {
      var t = e.monaco
      return t
    })
  }
  var ve = new Promise(function (e, t) {
      return G({ resolve: e, reject: t })
    }),
    er = { config: Gt, init: Kt, __getMonacoInstance: Jt }
  me.default = er
})
var z = w((he) => {
  'use strict'
  Object.defineProperty(he, '__esModule', { value: !0 })
  var tr = Qe()
  he.default = tr.default
})
var at = w((en, ot) => {
  'use strict'
  var rr = Object.create,
    Y = Object.defineProperty,
    nr = Object.getOwnPropertyDescriptor,
    ir = Object.getOwnPropertyNames,
    or = Object.getPrototypeOf,
    ar = Object.prototype.hasOwnProperty,
    ur = (e, t) => {
      for (var r in t) Y(e, r, { get: t[r], enumerable: !0 })
    },
    et = (e, t, r, n) => {
      if ((t && typeof t == 'object') || typeof t == 'function')
        for (let i of ir(t))
          !ar.call(e, i) &&
            i !== r &&
            Y(e, i, { get: () => t[i], enumerable: !(n = nr(t, i)) || n.enumerable })
      return e
    },
    I = (e, t, r) => (
      (r = e != null ? rr(or(e)) : {}),
      et(t || !e || !e.__esModule ? Y(r, 'default', { value: e, enumerable: !0 }) : r, e)
    ),
    cr = (e) => et(Y({}, '__esModule', { value: !0 }), e),
    tt = {}
  ur(tt, {
    DiffEditor: () => _r,
    Editor: () => it,
    default: () => Wr,
    loader: () => lr.default,
    useMonaco: () => Ar,
  })
  ot.exports = cr(tt)
  var lr = I(z()),
    sr = P('react'),
    O = I(P('react')),
    fr = I(z()),
    dr = P('react'),
    be = I(P('react')),
    pr = {
      wrapper: { display: 'flex', position: 'relative', textAlign: 'initial' },
      fullWidth: { width: '100%' },
      hide: { display: 'none' },
    },
    ye = pr,
    gr = I(P('react')),
    vr = {
      container: {
        display: 'flex',
        height: '100%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      },
    },
    mr = vr
  function hr({ children: e }) {
    return gr.default.createElement('div', { style: mr.container }, e)
  }
  var br = hr,
    yr = br
  function Or({
    width: e,
    height: t,
    isEditorReady: r,
    loading: n,
    _ref: i,
    className: o,
    wrapperProps: a,
  }) {
    return be.default.createElement(
      'section',
      { style: { ...ye.wrapper, width: e, height: t }, ...a },
      !r && be.default.createElement(yr, null, n),
      be.default.createElement('div', {
        ref: i,
        style: { ...ye.fullWidth, ...(!r && ye.hide) },
        className: o,
      }),
    )
  }
  var jr = Or,
    rt = (0, dr.memo)(jr),
    wr = P('react')
  function Mr(e) {
    ;(0, wr.useEffect)(e, [])
  }
  var Oe = Mr,
    Xe = P('react')
  function Pr(e, t, r = !0) {
    let n = (0, Xe.useRef)(!0)
    ;(0, Xe.useEffect)(
      n.current || !r
        ? () => {
            n.current = !1
          }
        : e,
      t,
    )
  }
  var j = Pr
  function H() {}
  function T(e, t, r, n) {
    return Sr(e, n) || Er(e, t, r, n)
  }
  function Sr(e, t) {
    return e.editor.getModel(nt(e, t))
  }
  function Er(e, t, r, n) {
    return e.editor.createModel(t, r, n ? nt(e, n) : void 0)
  }
  function nt(e, t) {
    return e.Uri.parse(t)
  }
  function qr({
    original: e,
    modified: t,
    language: r,
    originalLanguage: n,
    modifiedLanguage: i,
    originalModelPath: o,
    modifiedModelPath: a,
    keepCurrentOriginalModel: s = !1,
    keepCurrentModifiedModel: f = !1,
    theme: b = 'light',
    loading: _ = 'Loading...',
    options: S = {},
    height: Q = '100%',
    width: X = '100%',
    className: Z,
    wrapperProps: J = {},
    beforeMount: ee = H,
    onMount: te = H,
  }) {
    let [y, A] = (0, O.useState)(!1),
      [L, d] = (0, O.useState)(!0),
      g = (0, O.useRef)(null),
      l = (0, O.useRef)(null),
      C = (0, O.useRef)(null),
      m = (0, O.useRef)(te),
      u = (0, O.useRef)(ee),
      R = (0, O.useRef)(!1)
    Oe(() => {
      let c = fr.default.init()
      return (
        c
          .then((v) => (l.current = v) && d(!1))
          .catch(
            (v) => v?.type !== 'cancelation' && console.error('Monaco initialization: error:', v),
          ),
        () => (g.current ? D() : c.cancel())
      )
    }),
      j(
        () => {
          let c = g.current.getModifiedEditor()
          c.getOption(l.current.editor.EditorOption.readOnly)
            ? c.setValue(t || '')
            : t !== c.getValue() &&
              (c.executeEdits('', [
                { range: c.getModel().getFullModelRange(), text: t || '', forceMoveMarkers: !0 },
              ]),
              c.pushUndoStop())
        },
        [t],
        y,
      ),
      j(
        () => {
          g.current?.getModel()?.original.setValue(e || '')
        },
        [e],
        y,
      ),
      j(
        () => {
          let { original: c, modified: v } = g.current.getModel()
          l.current.editor.setModelLanguage(c, n || r || 'text'),
            l.current.editor.setModelLanguage(v, i || r || 'text')
        },
        [r, n, i],
        y,
      ),
      j(
        () => {
          l.current?.editor.setTheme(b)
        },
        [b],
        y,
      ),
      j(
        () => {
          g.current?.updateOptions(S)
        },
        [S],
        y,
      )
    let F = (0, O.useCallback)(() => {
        if (!l.current) return
        u.current(l.current)
        let c = T(l.current, e || '', n || r || 'text', o || ''),
          v = T(l.current, t || '', i || r || 'text', a || '')
        g.current?.setModel({ original: c, modified: v })
      }, [r, t, i, e, n, o, a]),
      k = (0, O.useCallback)(() => {
        !R.current &&
          C.current &&
          ((g.current = l.current.editor.createDiffEditor(C.current, {
            automaticLayout: !0,
            ...S,
          })),
          F(),
          l.current?.editor.setTheme(b),
          A(!0),
          (R.current = !0))
      }, [S, b, F])
    ;(0, O.useEffect)(() => {
      y && m.current(g.current, l.current)
    }, [y]),
      (0, O.useEffect)(() => {
        !L && !y && k()
      }, [L, y, k]),
      j(
        () => {
          if (g.current && l.current) {
            let c = g.current.getOriginalEditor(),
              v = T(l.current, e || '', n || r || 'text', o || '')
            v !== c.getModel() && c.setModel(v)
          }
        },
        [o],
        y,
      ),
      j(
        () => {
          if (g.current && l.current) {
            let c = g.current.getModifiedEditor(),
              v = T(l.current, t || '', i || r || 'text', a || '')
            v !== c.getModel() && c.setModel(v)
          }
        },
        [a],
        y,
      )
    function D() {
      let c = g.current?.getModel()
      s || c?.original?.dispose(), f || c?.modified?.dispose(), g.current?.dispose()
    }
    return O.default.createElement(rt, {
      width: X,
      height: Q,
      isEditorReady: y,
      loading: _,
      _ref: C,
      className: Z,
      wrapperProps: J,
    })
  }
  var Ir = qr,
    _r = (0, sr.memo)(Ir),
    Rr = P('react'),
    Ze = I(z())
  function Tr() {
    let [e, t] = (0, Rr.useState)(Ze.default.__getMonacoInstance())
    return (
      Oe(() => {
        let r
        return (
          e ||
            ((r = Ze.default.init()),
            r.then((n) => {
              t(n)
            })),
          () => r?.cancel()
        )
      }),
      e
    )
  }
  var Ar = Tr,
    Lr = P('react'),
    p = I(P('react')),
    Cr = I(z()),
    Je = P('react')
  function Dr(e) {
    let t = (0, Je.useRef)()
    return (
      (0, Je.useEffect)(() => {
        t.current = e
      }, [e]),
      t.current
    )
  }
  var xr = Dr,
    K = new Map()
  function Nr({
    defaultValue: e,
    defaultLanguage: t,
    defaultPath: r,
    value: n,
    language: i,
    path: o,
    theme: a = 'light',
    line: s,
    loading: f = 'Loading...',
    options: b = {},
    overrideServices: _ = {},
    saveViewState: S = !0,
    keepCurrentModel: Q = !1,
    width: X = '100%',
    height: Z = '100%',
    className: J,
    wrapperProps: ee = {},
    beforeMount: te = H,
    onMount: y = H,
    onChange: A,
    onValidate: L = H,
  }) {
    let [d, g] = (0, p.useState)(!1),
      [l, C] = (0, p.useState)(!0),
      m = (0, p.useRef)(null),
      u = (0, p.useRef)(null),
      R = (0, p.useRef)(null),
      F = (0, p.useRef)(y),
      k = (0, p.useRef)(te),
      D = (0, p.useRef)(),
      c = (0, p.useRef)(n),
      v = xr(o),
      we = (0, p.useRef)(!1),
      re = (0, p.useRef)(!1)
    Oe(() => {
      let h = Cr.default.init()
      return (
        h
          .then((E) => (m.current = E) && C(!1))
          .catch(
            (E) => E?.type !== 'cancelation' && console.error('Monaco initialization: error:', E),
          ),
        () => (u.current ? ct() : h.cancel())
      )
    }),
      j(
        () => {
          let h = T(m.current, e || n || '', t || i || '', o || r || '')
          h !== u.current?.getModel() &&
            (S && K.set(v, u.current?.saveViewState()),
            u.current?.setModel(h),
            S && u.current?.restoreViewState(K.get(o)))
        },
        [o],
        d,
      ),
      j(
        () => {
          u.current?.updateOptions(b)
        },
        [b],
        d,
      ),
      j(
        () => {
          !u.current ||
            n === void 0 ||
            (u.current.getOption(m.current.editor.EditorOption.readOnly)
              ? u.current.setValue(n)
              : n !== u.current.getValue() &&
                ((re.current = !0),
                u.current.executeEdits('', [
                  {
                    range: u.current.getModel().getFullModelRange(),
                    text: n,
                    forceMoveMarkers: !0,
                  },
                ]),
                u.current.pushUndoStop(),
                (re.current = !1)))
        },
        [n],
        d,
      ),
      j(
        () => {
          let h = u.current?.getModel()
          h && i && m.current?.editor.setModelLanguage(h, i)
        },
        [i],
        d,
      ),
      j(
        () => {
          s !== void 0 && u.current?.revealLine(s)
        },
        [s],
        d,
      ),
      j(
        () => {
          m.current?.editor.setTheme(a)
        },
        [a],
        d,
      )
    let Me = (0, p.useCallback)(() => {
      if (!(!R.current || !m.current) && !we.current) {
        k.current(m.current)
        let h = o || r,
          E = T(m.current, n || e || '', t || i || '', h || '')
        ;(u.current = m.current?.editor.create(
          R.current,
          { model: E, automaticLayout: !0, ...b },
          _,
        )),
          S && u.current.restoreViewState(K.get(h)),
          m.current.editor.setTheme(a),
          g(!0),
          (we.current = !0)
      }
    }, [e, t, r, n, i, o, b, _, S, a])
    ;(0, p.useEffect)(() => {
      d && F.current(u.current, m.current)
    }, [d]),
      (0, p.useEffect)(() => {
        !l && !d && Me()
      }, [l, d, Me]),
      (c.current = n),
      (0, p.useEffect)(() => {
        d &&
          A &&
          (D.current?.dispose(),
          (D.current = u.current?.onDidChangeModelContent((h) => {
            re.current || A(u.current.getValue(), h)
          })))
      }, [d, A]),
      (0, p.useEffect)(() => {
        if (d) {
          let h = m.current.editor.onDidChangeMarkers((E) => {
            let ne = u.current.getModel()?.uri
            if (ne && E.find((ie) => ie.path === ne.path)) {
              let ie = m.current.editor.getModelMarkers({ resource: ne })
              L?.(ie)
            }
          })
          return () => {
            h?.dispose()
          }
        }
        return () => {}
      }, [d, L])
    function ct() {
      D.current?.dispose(),
        Q ? S && K.set(o, u.current.saveViewState()) : u.current.getModel()?.dispose(),
        u.current.dispose()
    }
    return p.default.createElement(rt, {
      width: X,
      height: Z,
      isEditorReady: d,
      loading: f,
      _ref: R,
      className: J,
      wrapperProps: ee,
    })
  }
  var Vr = Nr,
    it = (0, Lr.memo)(Vr),
    Wr = it
})
var je = lt(at(), 1)
import ut from 'react'
import './index.scss'
var zr = je.default.default || je.default,
  Hr = 'code-editor',
  Fr = (e) => {
    let { className: t, height: r, options: n, readOnly: i, ...o } = e,
      { theme: a } = Se(),
      s = [Hr, t, o?.defaultLanguage ? `language--${o.defaultLanguage}` : '']
        .filter(Boolean)
        .join(' ')
    return ut.createElement(zr, {
      className: s,
      height: r,
      loading: ut.createElement(Pe, { height: r }),
      options: {
        detectIndentation: !0,
        minimap: { enabled: !1 },
        readOnly: !!i,
        scrollBeyondLastLine: !1,
        tabSize: 2,
        wordWrap: 'on',
        ...n,
      },
      theme: a === 'dark' ? 'vs-dark' : 'vs',
      ...o,
    })
  },
  an = Fr
export { an as default }
