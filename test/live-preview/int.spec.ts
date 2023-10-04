import type { Page } from './payload-types'

import payload from '../../packages/payload/src'
import { mergeLivePreviewData } from '../../packages/payload/src/admin/components/views/LivePreview/useLivePreview/mergeData'
import { fieldSchemaToJSON } from '../../packages/payload/src/utilities/fieldSchemaToJSON'
import { initPayloadTest } from '../helpers/configHelpers'
import { RESTClient } from '../helpers/rest'
import { Pages } from './collections/Pages'
import configPromise, { pagesSlug } from './config'

require('isomorphic-fetch')

let client
let serverURL

describe('Collections - Live Preview', () => {
  beforeAll(async () => {
    const { serverURL: incomingServerURL } = await initPayloadTest({
      __dirname,
      init: { local: false },
    })

    serverURL = incomingServerURL
    const config = await configPromise
    client = new RESTClient(config, { serverURL, defaultSlug: pagesSlug })
    await client.login()
  })

  it('merges live preview data', async () => {
    const testPage = await payload.create({
      collection: pagesSlug,
      data: {
        slug: 'home',
        title: 'Test Page',
      },
    })

    expect(testPage?.id).toBeDefined()

    const pageEdits: Page = {
      title: 'Test Page (Changed)',
    } as Page

    const mergedData = await mergeLivePreviewData<Page>({
      depth: 1,
      existingData: testPage,
      fieldSchema: fieldSchemaToJSON(Pages.fields),
      incomingData: pageEdits,
      serverURL,
    })

    expect(mergedData.title).toEqual(pageEdits.title)
  })
})
