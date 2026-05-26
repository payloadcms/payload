import type {
  CollectionPreferences,
  Data,
  DefaultDocumentIDType,
  DocumentViewClientProps,
  FormState,
  FormStateWithoutComponents,
  Locale,
  SanitizedDocumentPermissions,
  TypedUser,
  ViewTypes,
} from 'payload'

/**
 * Coarse identifier for which `View` component `getDocumentView` resolved to.
 * Used by non-RSC adapters (e.g. TanStack Start) to render the matching
 * fallback view on the client, since the resolved React component itself
 * cannot cross a JSON boundary. `default` covers the standard edit/version
 * surfaces handled by `DefaultEditView` / `VersionView`.
 */
export type DocumentViewKind = 'default' | 'unauthorized'

/**
 * Serializable subset of document view data that can cross a JSON boundary
 * (e.g. TanStack Start server function → client component).
 */
export type SerializableDocumentViewData = {
  apiURL: string
  collectionSlug?: string
  currentEditor?: TypedUser
  disableActions: boolean
  doc: Data
  docPermissions: SanitizedDocumentPermissions
  documentSubViewType?: string
  entityPreferences?: { id: DefaultDocumentIDType; value: CollectionPreferences }
  formState: FormStateWithoutComponents
  globalSlug?: string
  hasDeletePermission: boolean
  hasPublishedDoc: boolean
  hasPublishPermission: boolean
  hasSavePermission: boolean
  hasTrashPermission: boolean
  id: number | string
  isEditing: boolean
  isLivePreviewEnabled: boolean
  isLocked: boolean
  isPreviewEnabled: boolean
  isTrashedDoc: boolean
  lastUpdateTime?: number
  livePreviewBreakpoints?: {
    height: number | string
    label: string
    name: string
    width: number | string
  }[]
  livePreviewComponent?: string
  livePreviewURL?: string
  locale?: Locale
  mostRecentVersionIsAutosaved: boolean
  previewURL?: string
  redirect?: string
  showHeader: boolean
  typeofLivePreviewURL?: 'function' | 'string' | undefined
  unpublishedVersionCount: number
  versionCount: number
  viewKind?: DocumentViewKind
  viewType: ViewTypes
}

/**
 * Strip non-serializable `customComponents` (React elements) from FormState.
 * Preserves primitive values like `false` which signal that a field should not render.
 */
export function toSerializableFormState(formState: FormState): FormStateWithoutComponents {
  const result: FormStateWithoutComponents = {}

  for (const [path, fieldState] of Object.entries(formState)) {
    const { customComponents, ...rest } = fieldState

    if (customComponents) {
      const serializableComponents: Record<string, false> = {}
      let hasSerializable = false

      for (const [key, value] of Object.entries(customComponents)) {
        if (value === false) {
          serializableComponents[key] = false
          hasSerializable = true
        }
      }

      if (hasSerializable) {
        ;(rest as any).customComponents = serializableComponents
      }
    }

    result[path] = rest
  }

  return result
}

/**
 * Build DocumentViewClientProps from serializable data.
 * Slots are intentionally empty — DefaultEditView renders defaults for missing slots.
 * The form will re-fetch full state (including customComponents) via server functions.
 */
export function buildDocumentViewClientProps(
  data: SerializableDocumentViewData,
): DocumentViewClientProps {
  return {
    documentSubViewType: data.documentSubViewType as DocumentViewClientProps['documentSubViewType'],
    formState: data.formState as FormState,
    viewType: data.viewType,
  }
}
