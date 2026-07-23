import { describe, expect, it } from 'vitest'

import { ValidationError } from './ValidationError.js'

describe('ValidationError', () => {
  it('should retain locales while listing field labels and paths in the message', () => {
    const error = new ValidationError({
      errors: [
        {
          label: 'Title',
          locale: 'de',
          message: 'Title is required',
          path: 'title',
        },
        {
          message: 'SEO description is required',
          path: 'seo.description',
        },
      ],
    })

    expect(error.message).toBe('The following fields are invalid: Title, seo.description')
    expect(error.data.errors).toEqual([
      {
        label: 'Title',
        locale: 'de',
        message: 'Title is required',
        path: 'title',
      },
      {
        message: 'SEO description is required',
        path: 'seo.description',
      },
    ])
  })
})
