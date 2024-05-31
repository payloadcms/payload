import * as i from 'react'
var d = (r, e = !1) => {
  let [t, o] = i.useState(!1),
    s = i.useRef(void 0),
    a = i.useCallback(
      () => (
        o(!1),
        clearTimeout(s.current),
        (s.current = setTimeout(() => {
          o(!0)
        }, r)),
        () => {
          clearTimeout(s.current)
        }
      ),
      [r],
    )
  return (
    i.useEffect(() => {
      e && a()
    }, [a, e]),
    [t, a]
  )
}
import * as c from 'react'
import './index.scss'
var x = ({ animationDelay: r = '0ms', height: e = '60px', width: t = '100%' }) =>
    c.createElement(
      'div',
      {
        className: 'shimmer-effect',
        style: {
          height: typeof e == 'number' ? `${e}px` : e,
          width: typeof t == 'number' ? `${t}px` : t,
        },
      },
      c.createElement('div', { className: 'shimmer-effect__shine', style: { animationDelay: r } }),
    ),
  E = ({
    className: r,
    count: e,
    height: t,
    renderDelay: o = 500,
    shimmerDelay: s = 25,
    shimmerItemClassName: a,
    width: h,
  }) => {
    let u = typeof s == 'number' ? `${s}ms` : s,
      [l] = d(o, !0)
    return l
      ? c.createElement(
          'div',
          { className: r },
          [...Array(e)].map((m, n) =>
            c.createElement(
              'div',
              { className: a, key: n },
              c.createElement(x, { animationDelay: `calc(${n} * ${u})`, height: t, width: h }),
            ),
          ),
        )
      : null
  }
import y, {
  createContext as T,
  useCallback as b,
  useContext as C,
  useEffect as k,
  useState as f,
} from 'react'
var R = { autoMode: !0, setTheme: () => null, theme: 'light' },
  g = T(R)
function p(r, e, t) {
  let o = new Date()
  o.setTime(o.getTime() + t * 24 * 60 * 60 * 1e3)
  let s = 'expires=' + o.toUTCString()
  document.cookie = r + '=' + e + ';' + s + ';path=/'
}
var v = (r) => {
    let e,
      t = window.document.cookie
        .split('; ')
        .find((o) => o.startsWith(`${r}=`))
        ?.split('=')[1]
    return (
      t === 'light' || t === 'dark'
        ? (e = t)
        : (e =
            window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light'),
      document.documentElement.setAttribute('data-theme', e),
      { theme: e, themeFromCookies: t }
    )
  },
  w = 'light',
  M = ({ children: r, cookiePrefix: e, theme: t }) => {
    let o = `${e || 'payload'}-theme`,
      [s, a] = f(t || w),
      [h, u] = f()
    k(() => {
      let { theme: m, themeFromCookies: n } = v(o)
      a(m), u(!n)
    }, [o])
    let l = b(
      (m) => {
        if (m === 'light' || m === 'dark')
          a(m), u(!1), p(o, m, 365), document.documentElement.setAttribute('data-theme', m)
        else if (m === 'auto') {
          p(o, m, -1)
          let n =
            window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light'
          document.documentElement.setAttribute('data-theme', n), u(!0), a(n)
        }
      },
      [o],
    )
    return y.createElement(g.Provider, { value: { autoMode: h, setTheme: l, theme: s } }, r)
  },
  $ = () => C(g)
export { d as a, x as b, E as c, w as d, M as e, $ as f }
