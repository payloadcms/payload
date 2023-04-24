import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import wait from '../src/utilities/wait';
import { devUser } from './credentials';

type FirstRegisterArgs = {
  page: Page;
  serverURL: string;
};

type LoginArgs = {
  page: Page;
  serverURL: string;
};

export async function firstRegister(args: FirstRegisterArgs): Promise<void> {
  const { page, serverURL } = args;

  await page.goto(`${serverURL}/admin`);
  await page.fill('#field-email', devUser.email);
  await page.fill('#field-password', devUser.password);
  await page.fill('#field-confirm-password', devUser.password);
  await wait(500);
  await page.click('[type=submit]');
  await page.waitForURL(`${serverURL}/admin`);
}

export async function login(args: LoginArgs): Promise<void> {
  const { page, serverURL } = args;

  await page.goto(`${serverURL}/admin`);
  await page.fill('#field-email', devUser.email);
  await page.fill('#field-password', devUser.password);
  await wait(500);
  await page.click('[type=submit]');
  await page.waitForURL(`${serverURL}/admin`);
}

export async function saveDocAndAssert(page: Page, selector = '#action-save'): Promise<void> {
  await page.click(selector, { delay: 100 });
  await expect(page.locator('.Toastify')).toContainText('successfully');
  expect(page.url()).not.toContain('create');
}
