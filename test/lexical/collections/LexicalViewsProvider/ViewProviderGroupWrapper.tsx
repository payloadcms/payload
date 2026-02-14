'use client'
import type { GroupFieldClientComponent } from 'payload'

import { RichTextViewProvider } from '@payloadcms/richtext-lexical/client'
import { GroupField } from '@payloadcms/ui'

/**
 * Custom group field component that wraps its children in a RichTextViewProvider
 * with `currentView="frontend"` and `inheritable={true}`.
 *
 * Note: No `views` prop is passed to the provider. This tests that `currentView` can be
 * inherited independently of `views`. Nested richtext fields will inherit currentView="frontend"
 * and use their own configured views map to render that view.
 *
 * Expected behavior:
 * - Nested richtext fields should have data-lexical-view="frontend"
 * - ViewSelector should be hidden (hasInheritedViews=true)
 * - Each nested field uses its own views map to resolve the "frontend" view
 */
export const ViewProviderGroupWrapper: GroupFieldClientComponent = (props) => {
  return (
    <RichTextViewProvider currentView="frontend" inheritable={true}>
      <GroupField {...props} />
    </RichTextViewProvider>
  )
}
