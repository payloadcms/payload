import type { TabsField } from '../../payload-types'

import { getBlocksFieldSeedData } from '../Blocks/shared'
import { localizedTextValue, namedTabText } from './constants'

export const tabsDoc: Partial<TabsField> = {
  array: [
    {
      text: "Hello, I'm the first row",
    },
    {
      text: 'Second row here',
    },
    {
      text: 'Here is some data for the third row',
    },
  ],
  blocks: getBlocksFieldSeedData(),
  group: {
    number: 12,
  },
  nestedTab: {
    text: 'Some text in a nested, named tab',
  },
  tab: {
    array: [
      {
        text: "Hello, I'm the first row, in a named tab",
      },
      {
        text: 'Second row here, in a named tab',
      },
      {
        text: 'Here is some data for the third row, in a named tab',
      },
    ],
    text: namedTabText,
    arrayInRow: [
      {
        text: "Hello, I'm some text in an array in a row",
      },
    ],
  },
  localizedTab: {
    text: localizedTextValue,
  },
  accessControlTab: {
    text: 'cannot be read',
  },
  hooksTab: {
    beforeValidate: false,
    beforeChange: false,
    afterChange: false,
    afterRead: false,
  },
  tabWithNestedAfterChange: {
    text: 'initialNestedValue',
  },
  textarea: 'Here is some text that goes in a textarea',
  anotherText: 'Super tired of writing this text',
  textInRow: 'hello',
  numberInRow: 235,
}
