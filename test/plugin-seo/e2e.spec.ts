import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadE2E } from '../helpers/configHelpers'

const { beforeAll, describe } = test
let url: AdminUrlUtil

describe('SEO Plugin', () => {
  beforeAll(async () => {
    const { serverURL } = await initPayloadE2E(__dirname)
    url = new AdminUrlUtil(serverURL, 'pages')
  })

  test('test', async () => {
    await expect(true).toBe(true)
  })

  // it.todo('e2e: should auto-generate meta title when button is clicked')

  // it.todo('e2e: should properly merge top-level tabs when `tabbedUI` is enabled')

  // it.todo('e2e: should render a preview image of a mock search engine result')

  // it.todo('e2e: should render the length indicator with the correct progress and color')
})
