import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import type { Page as PayloadPage } from './payload-types'
import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadE2E } from '../helpers/configHelpers'
import payload from '../../packages/payload/src'
import { initPageConsoleErrorCatch } from '../helpers'
import path from 'path'
import getFileByPath from '../../packages/payload/src/uploads/getFileByPath'
import { mediaSlug } from './shared'

const { beforeAll, describe } = test
let url: AdminUrlUtil
let page: Page
let id: string

async function createPage(overrides?: Partial<PayloadPage>): Promise<PayloadPage> {
  const filePath = path.resolve(__dirname, './image-1.jpg')
  const file = await getFileByPath(filePath)

  const mediaDoc = await payload.create({
    collection: mediaSlug,
    data: {},
    file,
  })

  return payload.create({
    collection: 'pages',
    data: {
      title: 'Test Page',
      slug: 'test-page',
      meta: {
        title: 'This is a test meta title',
        description: 'This is a test meta description',
        ogTitle: 'This is a custom og:title field',
        image: mediaDoc.id,
      },
    },
  }) as unknown as Promise<PayloadPage>
}

describe('SEO Plugin', () => {
  beforeAll(async ({ browser }) => {
    const { serverURL } = await initPayloadE2E(__dirname)
    url = new AdminUrlUtil(serverURL, 'pages')

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    const createdPage = await createPage()
    id = createdPage.id
  })

  describe('Core functionality', () => {
    test('Config tab should be merged in correctly', async () => {
      await page.goto(url.edit(id))
      const contentTabsClass = '.tabs-field__tabs .tabs-field__tab-button'

      const firstTab = page.locator(contentTabsClass).nth(0)
      await expect(firstTab).toContainText('General')
    })

    test('Should auto-generate meta title when button is clicked in tabs', async () => {
      const contentTabsClass = '.tabs-field__tabs .tabs-field__tab-button'
      const autoGenerateButtonClass = '.group-field__wrap .render-fields div:nth-of-type(1) button'
      const metaTitleClass = '#field-title'

      const secondTab = page.locator(contentTabsClass).nth(1)
      await secondTab.click()

      const metaTitle = page.locator(metaTitleClass).nth(0)
      await expect(metaTitle).toHaveValue('This is a test meta title')

      const autoGenButton = page.locator(autoGenerateButtonClass).nth(0)
      await autoGenButton.click()

      await expect(metaTitle).toHaveValue('Website.com — Test Page')
    })

    // todo: Re-enable this test once required attributes are fixed
    /* test('Title should be required as per custom override', async () => {
      const metaTitleClass = '#field-title'

      const metaTitle = page.locator(metaTitleClass).nth(0)

      await expect(metaTitle).toHaveAttribute('required', '')
    }) */

    test('Indicator should be orangered and characters counted', async () => {
      const indicatorClass =
        '#field-meta > div > div.render-fields.render-fields--margins-small > div:nth-child(2) > div:nth-child(3) > div > div:nth-child(3) > div'
      const indicatorLabelClass =
        '#field-meta > div > div.render-fields.render-fields--margins-small > div:nth-child(2) > div:nth-child(3) > div > div:nth-child(2)'

      const indicator = page.locator(indicatorClass)
      const indicatorLabel = page.locator(indicatorLabelClass)

      await expect(indicatorLabel).toContainText('23/50-60 chars, 27 to go')
      await expect(indicator).toHaveCSS('background-color', 'rgb(255, 69, 0)')
    })

    test('Should generate a search result preview based on content', async () => {
      await page.goto(url.edit(id))
      const contentTabsClass = '.tabs-field__tabs .tabs-field__tab-button'
      const autoGenerateButtonClass = '.group-field__wrap .render-fields div:nth-of-type(1) button'
      const metaDescriptionClass = '#field-description'
      const previewClass =
        '#field-meta > div > div.render-fields.render-fields--margins-small > div:nth-child(6) > div:nth-child(3)'

      const secondTab = page.locator(contentTabsClass).nth(1)
      await secondTab.click()

      const metaDescription = page.locator(metaDescriptionClass).nth(0)
      await metaDescription.fill('My new amazing SEO description')

      const preview = page.locator(previewClass).nth(0)
      await expect(preview).toContainText('https://yoursite.com/en/')
      await expect(preview).toContainText('This is a test meta title')
      await expect(preview).toContainText('My new amazing SEO description')
    })
  })

  describe('i18n', () => {
    test('Test support for another language', async () => {
      await page.goto(url.edit(id))
      const contentTabsClass = '.tabs-field__tabs .tabs-field__tab-button'
      const autoGenerateButtonClass = '.group-field__wrap .render-fields div:nth-of-type(1) button'

      const secondTab = page.locator(contentTabsClass).nth(1)
      await secondTab.click()

      const autoGenButton = page.locator(autoGenerateButtonClass).nth(0)

      await expect(autoGenButton).toContainText('Auto-generate')

      // Go to account page
      await page.goto(url.account)

      const languageField = page.locator('.payload-settings__language .react-select')
      const options = page.locator('.rs__option')

      // Change language to Spanish
      await languageField.click()
      await options.locator('text=Español').click()

      // Navigate back to the page
      await page.goto(url.edit(id))

      await secondTab.click()

      await expect(autoGenButton).toContainText('Auto-génerar')
    })
  })
})
