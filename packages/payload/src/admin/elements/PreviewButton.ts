import type { ServerProps } from '../../config/types.js'

export type PreviewButtonClientProps = {}

export type PreviewButtonServerPropsOnly = {} & ServerProps

export type PreviewButtonServerProps = PreviewButtonClientProps & PreviewButtonServerPropsOnly
