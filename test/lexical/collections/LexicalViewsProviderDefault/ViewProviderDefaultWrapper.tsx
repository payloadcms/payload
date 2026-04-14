'use client'
import type { GroupFieldClientComponent } from 'payload'

import { RichTextViewProvider } from '@payloadcms/richtext-lexical/client'
import { GroupField } from '@payloadcms/ui'

/**
 * Custom group field component that forces currentView="default" with inheritable={true}.
 *
 * Tests that explicit currentView inheritance works even when the value is "default".
 * The hasExplicitCurrentView flag should be true, hiding the ViewSelector in nested fields.
 */
export const ViewProviderDefaultWrapper: GroupFieldClientComponent = (props) => {
  return (
    <RichTextViewProvider currentView="default" inheritable={true}>
      <GroupField {...props} />
    </RichTextViewProvider>
  )
}
