// The root entry is reserved for the build-time `withPayload` vite helper only.
// Keeping runtime code out of this barrel prevents client bundles from dragging
// in the server graph. Import runtime utilities from the scoped subpaths instead:
// `@payloadcms/tanstack-start/client`, `/server`, `/shared`, `/layouts`, or `/rsc`.
export {
  payloadReactOptions,
  payloadRscOptions,
  payloadTanstackStartOptions,
  withPayload,
} from './vite/index.js'
export type {
  PayloadPluginOptions,
  PayloadTanstackStartOptionsArgs,
  WithPayloadBuilder,
  WithPayloadBuilderContext,
  WithPayloadOptions,
} from './vite/index.js'
