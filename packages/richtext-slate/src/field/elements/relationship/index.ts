import type { RichTextCustomElement } from '../../../types.js'

import { relationshipName } from './shared.js'

export const relationship: RichTextCustomElement = {
  name: relationshipName,
  Button: '@ruya.sa/richtext-slate/client#RelationshipButton',
  Element: '@ruya.sa/richtext-slate/client#RelationshipElement',
  plugins: ['@ruya.sa/richtext-slate/client#WithRelationship'],
}
