import type { RequiredDataFromCollection } from 'payload/types'

import type { ConditionalLogic } from '../../payload-types.js'

export const conditionalLogicDoc: RequiredDataFromCollection<ConditionalLogic> = {
  text: 'Seeded conditional logic document',
  toggleField: true,
  fieldWithCondition: 'spiderman',
  customFieldWithCondition: 'batman',
}
