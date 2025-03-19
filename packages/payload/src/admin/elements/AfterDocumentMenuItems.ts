import type { ServerProps } from '../../config/types.js'

export type AfterDocumentMenuItemsClientProps = {}

export type AfterDocumentMenuItemsServerPropsOnly = {} & ServerProps

export type AfterDocumentMenuItemsServerProps = AfterDocumentMenuItemsClientProps &
  AfterDocumentMenuItemsServerPropsOnly
