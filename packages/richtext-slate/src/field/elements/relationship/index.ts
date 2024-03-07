import type { RichTextCustomElement } from '../../../types.js'

import { Button } from './Button/index.js'
import { Element } from './Element/index.js'
import { WithRelationship } from './plugin.js'
import { relationshipName } from './shared.js'

export const relationship: RichTextCustomElement = {
  name: relationshipName,
  Button,
  Element,
  plugins: [WithRelationship],
}
