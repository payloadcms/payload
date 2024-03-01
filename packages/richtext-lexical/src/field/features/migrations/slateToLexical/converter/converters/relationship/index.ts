import type { SlateNodeConverterProvider } from '../../types'

import { RelationshipConverterClient } from './client'
import { _SlateRelationshipConverter } from './converter'

export const SlateRelationshipConverter: SlateNodeConverterProvider = {
  ClientComponent: RelationshipConverterClient,
  converter: _SlateRelationshipConverter,
}
