import type { ServerProps } from '../../config/types.js'

export type SaveDraftButtonClientProps = {}

export type SaveDraftButtonServerPropsOnly = {} & ServerProps

export type SaveDraftButtonServerProps = SaveDraftButtonClientProps & SaveDraftButtonServerPropsOnly
