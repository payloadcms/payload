import { expect, type Page } from '@playwright/test'

type Args = {
  page: Page
}

export async function expectNoResultsAndCreateFolderButton({ page }: Args): Promise<void> {
  const noResultsDiv = page.locator('div.no-results')
  await expect(noResultsDiv).toBeVisible()
  const createFolderButton = page.locator('text=Create Folder')
  await expect(createFolderButton).toBeVisible()
}
