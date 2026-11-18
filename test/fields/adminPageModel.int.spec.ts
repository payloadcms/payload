import { expect } from 'vitest'

import { createAdminPageModelDescriptor } from '../__helpers/e2e/adminPageModel/generate.js'
import { test } from '../__helpers/int/vitest.js'
import { adminPageModel } from './admin-page-model.generated.js'
import config from './config.js'

test.suite({})('fields Admin page model', () => {
  test('should match the current evaluated configuration', async () => {
    const sanitizedConfig = await config
    const currentDescriptor = createAdminPageModelDescriptor(sanitizedConfig, {
      collections: ['array-fields', 'relationship-fields', 'text-fields'],
    })

    expect(adminPageModel).toEqual(currentDescriptor)
  })
})
