import type { ArrayField } from '../../payload-types.js'

export const arrayDoc: Partial<ArrayField> = {
  arrayWithMinRows: [
    {
      text: 'first row',
    },
    {
      text: 'second row',
    },
  ],
  collapsedArray: [
    {
      text: 'initialize collapsed',
    },
  ],
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
  title: 'array doc 1',
}

export const anotherArrayDoc: Partial<ArrayField> = {
  arrayWithMinRows: [
    {
      text: 'first row',
    },
    {
      text: 'second row',
    },
  ],
  collapsedArray: [
    {
      text: 'initialize collapsed',
    },
  ],
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
  ],
  title: 'array doc 2',
}
