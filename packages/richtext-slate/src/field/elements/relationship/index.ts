import type { RichTextCustomElement } from '../../..'

import Button from './Button'
import Element from './Element'
import { WithRelationship } from './plugin'
import { relationshipName } from './shared'

const relationship: RichTextCustomElement = {
  name: relationshipName,
  Button,
  Element,
  plugins: [WithRelationship],
}

export default relationship
