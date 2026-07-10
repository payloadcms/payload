'use client'
import type { GroupFieldClientComponent } from 'payload'

import { RichTextViewProvider } from '@payloadcms/richtext-lexical/client'
import { GroupField } from '@payloadcms/ui'

/**
 * Custom group field component that forces currentView="frontend" with inheritable={true}.
 *
 * The nested richtext field does NOT have a "frontend" view — only "default".
 * This tests that the field correctly falls back to its "default" view config
 * when the inherited view doesn't exist in its own views map.
 *
 * Expected behavior:
 * - RichTextViewProvider resolves currentViewMap via views["frontend"] || views.default
 * - The field code should also fall back to views.default for admin/lexical/filterFeatures
 *
 * Current bug:
 * - The field reads views["frontend"] directly, gets undefined, and falls back to base
 *   _admin config instead of views.default.admin — so hideGutter from the default view is lost.
 */
export const ViewProviderFallbackWrapper: GroupFieldClientComponent = (props) => {
  return (
    <RichTextViewProvider currentView="frontend" inheritable={true}>
      <GroupField {...props} />
    </RichTextViewProvider>
  )
}
