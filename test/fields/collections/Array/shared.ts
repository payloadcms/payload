import type { ArrayField } from '../../payload-types'

export const arrayDoc: Partial<ArrayField> = {
  items: [
    {
      text: 'first row',
    },
    {
      text: 'second row',
    },
    {
      text: 'third row',
    },
    {
      text: 'fourth row',
    },
    {
      text: 'fifth row',
    },
    {
      text: 'sixth row',
    },
  ],
  collapsedArray: [
    {
      text: 'initialize collapsed',
    },
  ],
  arrayWithMinRows: [
    {
      text: 'first row',
    },
    {
      text: 'second row',
    },
  ],
}
