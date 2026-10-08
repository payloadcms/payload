// Imported for its side effect by the base app's `_payload` route via
// `@payload-suite-server-functions`, which registers these `createServerFn` definitions with
// the RSC environment. The suite's client components are their only other importer, and the
// RSC build replaces those with client references without traversing into them — leaving the
// functions out of the manifest that serves the server-function RPC.
import './server-functions/login/tanstackFunction.js'
import './server-functions/logout/tanstackFunction.js'
import './server-functions/refresh/tanstackFunction.js'
