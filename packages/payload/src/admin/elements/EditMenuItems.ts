import type { ServerProps } from '../../config/types.js'

export type EditMenuItemsClientProps = {}

export type EditMenuItemsServerPropsOnly = {} & ServerProps

export type EditMenuItemsServerProps = EditMenuItemsClientProps & EditMenuItemsServerPropsOnly
