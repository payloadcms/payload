import type { OptionObject } from 'payload'

import { describe, expect, it } from 'vitest'

import { mergeFilterOptionLabels } from './mergeFilterOptionLabels.js'

describe('mergeFilterOptionLabels', () => {
  it('returns the original options unchanged when there are no selectFilterOptions', () => {
    const options: OptionObject[] = [{ label: 'One', value: 'one' }]

    expect(mergeFilterOptionLabels({ options, selectFilterOptions: undefined })).toEqual(options)
  })

  it('overlays labels from selectFilterOptions onto options with a matching value', () => {
    const options: OptionObject[] = [
      { label: 'One', value: 'one' },
      { label: 'Two', value: 'two' },
    ]

    const result = mergeFilterOptionLabels({
      options,
      selectFilterOptions: [{ label: 'DB Label One', value: 'one' }],
    })

    expect(result).toEqual([
      { label: 'DB Label One', value: 'one' },
      { label: 'Two', value: 'two' },
    ])
  })

  it('leaves the label unchanged when selectFilterOptions has no matching value', () => {
    const options: OptionObject[] = [{ label: 'One', value: 'one' }]

    const result = mergeFilterOptionLabels({
      options,
      selectFilterOptions: [{ label: 'DB Label Two', value: 'two' }],
    })

    expect(result).toEqual([{ label: 'One', value: 'one' }])
  })

  it('leaves the label unchanged when selectFilterOptions contains string entries only', () => {
    const options: OptionObject[] = [{ label: 'One', value: 'one' }]

    const result = mergeFilterOptionLabels({ options, selectFilterOptions: ['one'] })

    expect(result).toEqual([{ label: 'One', value: 'one' }])
  })
})
