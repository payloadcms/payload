/* eslint-disable payload/no-imports-from-self -- This compile-only contract test must consume the package's public entrypoints. */
import {
  DefaultEditView,
  NullifyLocaleField,
  RenderCustomComponent,
  RenderFields,
  UploadHandlersProvider,
} from '@payloadcms/ui'
import {
  escapeDiffHTML,
  getHTMLDiffComponents,
  RenderServerComponent,
  unescapeDiffHTML,
} from '@payloadcms/ui/rsc'
import {
  fieldSchemasToFormState,
  getClientConfig,
  getClientSchemaMap,
  getSchemaMap,
} from '@payloadcms/ui/server'
import {
  type EntityToGroup,
  getVisibleEntities,
  groupNavItems,
  type NavGroupType,
  reduceToSerializableFields,
} from '@payloadcms/ui/shared'

void DefaultEditView
void NullifyLocaleField
void RenderCustomComponent
void RenderFields
void UploadHandlersProvider
void escapeDiffHTML
void getHTMLDiffComponents
void RenderServerComponent
void unescapeDiffHTML
void fieldSchemasToFormState
void getClientConfig
void getClientSchemaMap
void getSchemaMap
void getVisibleEntities
void groupNavItems
void reduceToSerializableFields

type PublicTypes = EntityToGroup | NavGroupType

export type { PublicTypes }
