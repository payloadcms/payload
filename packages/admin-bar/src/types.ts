import type { CSSProperties, ReactElement } from 'react'

export type PayloadMeUser =
  | {
      email: string
      id: string
    }
  | null
  | undefined

export type PayloadAdminBarProps = {
  adminPath?: string
  apiPath?: string
  authCollectionSlug?: string
  className?: string
  classNames?: {
    controls?: string
    create?: string
    edit?: string
    logo?: string
    logout?: string
    preview?: string
    user?: string
  }
  cmsURL?: string
  collectionLabels?: {
    plural?: string
    singular?: string
  }
  collectionSlug?: string
  createProps?: {
    [key: string]: unknown
    style?: CSSProperties
  }
  devMode?: boolean
  divProps?: {
    [key: string]: unknown
    style?: CSSProperties
  }
  editProps?: {
    [key: string]: unknown
    style?: CSSProperties
  }
  id?: string
  /**
   * Override the default English labels on each link. Each entry is
   * optional; omitted entries fall back to the built-in English string.
   *
   * For `edit` and `create`, you can pass either a plain string or a
   * function that receives the resolved collection singular label (when
   * `collectionLabels.singular` is set). Use the function form when you
   * want to interpolate the collection name into the label, e.g.
   * `edit: ({ singular }) => `Edytuj ${singular ?? 'stronę'}`.
   */
  labels?: {
    create?: ((args: { singular?: string }) => string) | string
    edit?: ((args: { singular?: string }) => string) | string
    exitPreview?: string
    logout?: string
    profile?: string
  }
  logo?: ReactElement
  logoProps?: {
    [key: string]: unknown
    style?: CSSProperties
  }
  logoutProps?: {
    [key: string]: unknown
    style?: CSSProperties
  }
  onAuthChange?: (user: PayloadMeUser) => void
  onPreviewExit?: () => void
  preview?: boolean
  previewProps?: {
    [key: string]: unknown
    style?: CSSProperties
  }
  style?: CSSProperties
  unstyled?: boolean
  userProps?: {
    [key: string]: unknown
    style?: CSSProperties
  }
}
