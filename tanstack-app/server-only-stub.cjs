// Stub for server-only Node.js packages when loaded in the browser.
// Payload admin runs as RSC in Next.js; in TanStack Start these modules
// get pulled into the client bundle. This stub prevents hard crashes.
const noop = function () {}
noop.prototype = {}

// Mongoose-style Types object
const Types = {
  ObjectId: noop,
  Decimal128: noop,
  Buffer: noop,
  Map: noop,
  Mixed: noop,
}

const stub = new Proxy(noop, {
  get(_, prop) {
    if (prop === '__esModule') return true
    if (prop === 'default') return stub
    if (prop === 'Types') return Types
    if (prop === 'Schema') return noop
    if (prop === 'model') return noop
    if (prop === 'connect') return noop
    if (prop === 'pino') return noop
    if (prop === 'levels') return {}
    if (prop === 'fileTypeFromFile') return undefined
    if (prop === 'fileTypeFromBuffer') return undefined
    if (prop === 'fileTypeFromStream') return undefined
    // For anything else, return a no-op or empty object
    return noop
  },
  apply() {
    return stub
  },
})

module.exports = stub
