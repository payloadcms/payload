import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import wait from '../../src/utilities/wait';


export const credentials = {
  email: 'dev@payloadcms.com',
  password: 'test',
  roles: ['admin'],
};

type FirstRegisterArgs = {
  page: Page,
  serverURL: string,
}

type LoginArgs = {
  page: Page,
  serverURL: string,
}

export async function firstRegister(args: FirstRegisterArgs): Promise<void> {
  const { page, serverURL } = args;

  await page.goto(`${serverURL}/admin`);
  await page.fill('#email', credentials.email);
  await page.fill('#password', credentials.password);
  await page.fill('#confirm-password', credentials.password);
  await wait(500);
  await page.click('[type=submit]');
  await page.waitForURL(`${serverURL}/admin`);
}

export async function login(args: LoginArgs): Promise<void> {
  const { page, serverURL } = args;

  await page.goto(`${serverURL}/admin`);
  await page.fill('#email', credentials.email);
  await page.fill('#password', credentials.password);
  await wait(500);
  await page.click('[type=submit]');
  await page.waitForURL(`${serverURL}/admin`);
}

export async function saveDocAndAssert(page: Page): Promise<void> {
  await page.click('text=Save', { delay: 100 });
  await expect(page.locator('.Toastify')).toContainText('successfully');
  expect(page.url()).not.toContain('create');
}
