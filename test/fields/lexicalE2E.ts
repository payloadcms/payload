import type { Page } from '@playwright/test'

import { test } from '@playwright/test'

import type { RESTClient } from '../helpers/rest'

//import { clearAndSeedEverything } from './seed'

const { beforeEach, describe } = test

export const lexicalE2E = (client: RESTClient, page: Page, serverURL: string) => {
  return () => {
    beforeEach(async ({ browser }) => {
      // await clearAndSeedEverything()
    })
  }
}
