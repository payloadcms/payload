import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import type { Post } from './config'

import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadE2E } from '../helpers/configHelpers'
import { slug } from './config'

const { afterEach, beforeAll, describe } = test

const title = 'title'
const description = 'description'

let url: AdminUrlUtil
let serverURL: string

describe('live-preview', () => {
  let page: Page

  beforeAll(async ({ browser }) => {
    serverURL = (await initPayloadE2E(__dirname)).serverURL
    url = new AdminUrlUtil(serverURL, slug)
    const context = await browser.newContext()
    page = await context.newPage()
  })

  describe('Preview', () => {
    test('should show preview tab in collection', async () => {
      // TODO: test preview tab
    })
  })
})
