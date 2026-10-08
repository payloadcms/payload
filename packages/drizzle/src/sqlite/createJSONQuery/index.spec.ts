import { describe, expect, it } from 'vitest'

import { createJSONQuery } from './index.js'

describe('createJSONQuery', () => {
  it('uses a supplied root SQL expression for scalar array comparisons', () => {
    const rootColumn = '(select json_group_array(tags.value) from article_tags as tags)'

    expect(
      createJSONQuery({
        column: rootColumn,
        operator: 'equals',
        pathSegments: ['tags'],
        value: 'available',
      }),
    ).toContain(`json_each(${rootColumn})`)
  })

  it('uses a supplied root SQL expression for array existence checks', () => {
    const rootColumn = '(select json_group_array(tags.value) from article_tags as tags)'

    expect(
      createJSONQuery({
        column: rootColumn,
        operator: 'exists',
        pathSegments: ['tags'],
        value: false,
      }),
    ).toContain(`NOT EXISTS (SELECT 1 FROM json_each(${rootColumn})`)
  })
})
