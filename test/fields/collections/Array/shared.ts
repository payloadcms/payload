import type { ArrayField } from '../../payload-types'

export const arrayDoc: Partial<ArrayField> = {
  title: 'array doc 1',
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

export const anotherArrayDoc: Partial<ArrayField> = {
  title: 'array doc 2',
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
  disableSort: [
    {
      text: 'un-sortable item 1',
    },
    {
      text: 'un-sortable item 2',
    },
    {
      text: 'un-sortable item 3',
    },
  ],
}
