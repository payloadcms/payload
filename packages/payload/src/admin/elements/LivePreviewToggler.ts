import type { ServerProps } from '../../config/types.js'

export type LivePreviewTogglerClientProps = {}

export type LivePreviewTogglerServerPropsOnly = {} & ServerProps

export type LivePreviewTogglerServerProps = LivePreviewTogglerClientProps &
  LivePreviewTogglerServerPropsOnly
