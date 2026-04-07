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
  livePreviewURL?: string
  locale?: Locale
  mostRecentVersionIsAutosaved: boolean
  previewURL?: string
  redirect?: string
  showHeader: boolean
  typeofLivePreviewURL?: 'function' | 'string' | undefined
  unpublishedVersionCount: number
  versionCount: number
  viewType: ViewTypes
}

/**
 * Strip `customComponents` from FormState for serialization.
 * Fields still render with default components when customComponents is absent.
 */
export function toSerializableFormState(formState: FormState): FormStateWithoutComponents {
  const result: FormStateWithoutComponents = {}

  for (const [path, fieldState] of Object.entries(formState)) {
    const { customComponents: _, ...rest } = fieldState
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
