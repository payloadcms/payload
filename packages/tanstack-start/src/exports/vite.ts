import { withPayload } from '../vite/index.js'

export { withPayload } from '../vite/index.js'
export type { WithPayloadOptions } from '../vite/index.js'

/**
 * @deprecated Use `withPayload` instead. `payloadPlugin` is a backwards-compatible
 * alias and will be removed in a future release. Note that the React, RSC, and
 * TanStack Start plugins are now instantiated internally, so the `reactPlugin`,
 * `rscPlugin`, and `tanstackStart` options are no longer required.
 */
export const payloadPlugin = withPayload

/** @deprecated Use `WithPayloadOptions` instead. */
export type { WithPayloadOptions as PayloadPluginOptions } from '../vite/index.js'
