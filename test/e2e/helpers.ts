import { Page } from '@playwright/test';
import wait from '../../src/utilities/wait';

const credentials = {
  email: 'test@test.com',
  password: 'test123',
  roles: ['admin'],
};


type FirstRegisterArgs = {
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
}
