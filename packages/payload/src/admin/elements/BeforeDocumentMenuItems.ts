import type { ServerProps } from '../../config/types.js'

export type BeforeDocumentMenuItemsClientProps = {}

export type BeforeDocumentMenuItemsServerPropsOnly = {} & ServerProps

export type BeforeDocumentMenuItemsServerProps = BeforeDocumentMenuItemsClientProps &
  BeforeDocumentMenuItemsServerPropsOnly
