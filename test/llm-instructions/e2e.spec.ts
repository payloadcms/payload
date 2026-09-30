import { expect, test } from '@playwright/test'
import { formatAdminURL, instructionsCollectionSlug } from 'payload/shared'

import { initPage } from '../__setup/e2e/initPage.js'

const serverURL = `http://localhost:${process.env.PORT || 3000}`
const instructionsURL = formatAdminURL({
  adminRoute: '/admin',
  path: `/collections/${instructionsCollectionSlug}`,
  serverURL,
})

test.beforeEach(async ({ page }) => {
  await initPage({ page, serverURL })
})

test('should manage LLM instructions from the collection menu', async ({ page }) => {
  await page.goto(`${serverURL}/admin/collections/pages`)
  await page.getByRole('button', { name: 'More options' }).click()
  await expect(page.getByRole('menuitem', { name: 'Edit LLM instructions' })).toHaveCount(1)
  await expect(page.getByRole('menuitem', { name: 'Edit LLM instructions' })).toHaveAttribute(
    'href',
    new URL(`${instructionsURL}/collection%3Apages`).pathname,
  )
  await page.getByRole('menuitem', { name: 'Edit LLM instructions' }).click()

  await expect(page).toHaveURL(`${instructionsURL}/collection%3Apages`)
  await page.getByRole('tab', { name: 'Additional instructions', exact: true }).click()
  await expect(page.locator('.llm-instructions__description')).toContainText('Pages collection')

  const editor = page.locator('.llm-instructions__editor [contenteditable="true"]')
  const documentURL = formatAdminURL({
    apiRoute: '/api',
    path: `/${instructionsCollectionSlug}/${new URL(page.url()).pathname.split('/').pop()}`,
    serverURL,
  })
  const originalResponse = await page.request.get(documentURL)
  const originalDocument = await originalResponse.json()
  const instructionText = 'Use concise headings and preserve the configured page layout.'

  try {
    await editor.fill(instructionText)
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled()
    await page.reload()
    await expect(editor).toHaveText(instructionText)

    await page.getByRole('tab', { name: 'System instructions (read-only)' }).click()
    await expect(
      page.locator('.llm-instructions__editor--system [contenteditable="false"]'),
    ).toContainText('Use the configured layout blocks.')
    await expect(
      page.locator('.llm-instructions__editor--system [contenteditable="true"]'),
    ).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Bold', exact: true })).toHaveCount(0)

    await page.goto(instructionsURL)
    await expect(page.getByRole('heading', { name: 'LLM Instructions' })).toBeVisible()
    await expect(page.locator('aside').getByRole('link', { name: 'LLM Instructions' })).toHaveCount(
      0,
    )
    await expect(page.getByRole('link', { name: 'Create New', exact: true })).toHaveCount(0)
    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeVisible()
    await page.getByRole('textbox', { name: 'Search', exact: true }).fill('Pages')
    await expect(
      page.locator('.llm-instructions-cell').filter({ hasText: instructionText }),
    ).toBeVisible()
  } finally {
    const restored = await page.request.patch(documentURL, {
      data: { additionalInstructions: originalDocument.additionalInstructions ?? null },
    })

    await expect(restored).toBeOK()
  }
})

test('should open the correct instructions document from the global menu', async ({ page }) => {
  await page.goto(
    formatAdminURL({ adminRoute: '/admin', path: '/globals/site-settings', serverURL }),
  )
  await page.getByRole('button', { name: 'More options', exact: true }).click()
  await expect(page.getByRole('menuitem', { name: 'Edit LLM instructions' })).toHaveAttribute(
    'href',
    new URL(`${instructionsURL}/global%3Asite-settings`).pathname,
  )
  await page.getByRole('menuitem', { name: 'Edit LLM instructions' }).click()

  await expect(page).toHaveURL(`${instructionsURL}/global%3Asite-settings`)
  await page.getByRole('tab', { name: 'Additional instructions', exact: true }).click()
  await expect(page.locator('.llm-instructions__description')).toContainText('Site Settings global')
  await page.getByRole('tab', { name: 'System instructions (read-only)' }).click()

  await expect(page.locator('.llm-instructions__description')).toContainText('global’s config file')
  await expect(
    page.locator('.llm-instructions__editor--system [contenteditable="false"]'),
  ).toBeEmpty()
})
