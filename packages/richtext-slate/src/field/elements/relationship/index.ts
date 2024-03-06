import type { RichTextCustomElement } from '../../../types.d.ts'

import Button from './Button/index.js'
import Element from './Element/index.js'
import { WithRelationship } from './plugin.js'
import { relationshipName } from './shared.js'

const relationship: RichTextCustomElement = {
  name: relationshipName,
  Button,
  Element,
  plugins: [WithRelationship],
}

export default relationship
