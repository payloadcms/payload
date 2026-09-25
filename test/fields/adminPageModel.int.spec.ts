import { describe, expect, it } from 'vitest'

import { createAdminPageModelDescriptor } from '../__helpers/e2e/adminPageModel/generate.js'
import { adminPageModel } from './admin-page-model.generated.js'
import config from './config.js'

describe('fields Admin page model', () => {
  it('matches the current evaluated configuration', async () => {
    const sanitizedConfig = await config
    const currentDescriptor = createAdminPageModelDescriptor(sanitizedConfig, {
      collections: ['array-fields', 'relationship-fields', 'text-fields'],
    })

    expect(adminPageModel).toEqual(currentDescriptor)
  })
})
