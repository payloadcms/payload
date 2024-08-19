import type { RichTextCustomElement } from '../../../types.js'

import { relationshipName } from './shared.js'

export const relationship: RichTextCustomElement = {
  name: relationshipName,
  Button: '@payloadcms/richtext-slate/client#RelationshipButton',
  Element: '@payloadcms/richtext-slate/client#RelationshipElement',
  plugins: ['@payloadcms/richtext-slate/client#WithRelationship'],
}
