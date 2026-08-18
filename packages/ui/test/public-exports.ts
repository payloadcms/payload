/* eslint-disable payload/no-imports-from-self -- This compile-only contract test must consume the package's public entrypoints. */
import { DefaultEditView, NullifyLocaleField, UploadHandlersProvider } from '@payloadcms/ui'
import { escapeDiffHTML, getHTMLDiffComponents, unescapeDiffHTML } from '@payloadcms/ui/rsc'
import { type EntityToGroup, groupNavItems, type NavGroupType } from '@payloadcms/ui/shared'

void DefaultEditView
void NullifyLocaleField
void UploadHandlersProvider
void escapeDiffHTML
void getHTMLDiffComponents
void unescapeDiffHTML
void groupNavItems

type PublicTypes = EntityToGroup | NavGroupType

export type { PublicTypes }
