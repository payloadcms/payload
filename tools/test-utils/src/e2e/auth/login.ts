import type { Config } from 'payload'
import type { Page } from 'playwright/test'

import { formatAdminURL, wait } from 'payload/shared'
import { expect } from 'playwright/test'

import type { AdminRoutes } from '../helpers.js'

import { devUser } from '../../shared/credentials.js'
import { getRoutes, POLL_TOPASS_TIMEOUT } from '../helpers.js'
import { openNav } from '../toggleNav.js'

type LoginArgs = {
  customAdminRoutes?: AdminRoutes
  customRoutes?: Config['routes']
  data?: {
    email: string
    password: string
  }
  page: Page
  serverURL: string
}

export async function login(args: LoginArgs): Promise<void> {
  const { customAdminRoutes, customRoutes, data = devUser, page, serverURL } = args

  const {
    admin: {
      routes: { createFirstUser, login: incomingLoginRoute, logout: incomingLogoutRoute } = {},
    },
    routes: { admin: incomingAdminRoute } = {},
  } = getRoutes({ customAdminRoutes, customRoutes })

  const logoutRoute = formatAdminURL({
    serverURL,
    adminRoute: incomingAdminRoute,
    path: incomingLogoutRoute,
  })

  await page.goto(logoutRoute)
  await wait(500)

  const adminRoute = formatAdminURL({ serverURL, adminRoute: incomingAdminRoute, path: '' })
  const loginRoute = formatAdminURL({
    serverURL,
    adminRoute: incomingAdminRoute,
    path: incomingLoginRoute,
  })
  const createFirstUserRoute = formatAdminURL({
    serverURL,
    adminRoute: incomingAdminRoute,
    path: createFirstUser,
  })

  await page.goto(loginRoute)
  await wait(500)
  await page.fill('#field-email', data.email)
  await page.fill('#field-password', data.password)
  await wait(500)
  await page.click('[type=submit]')
  await page.waitForURL(adminRoute)

  await expect(() => expect(page.url()).not.toContain(loginRoute)).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
  })

  await expect(() => expect(page.url()).not.toContain(createFirstUserRoute)).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
  })
}

/**
 * Logs a user in by navigating via click-ops instead of using page.goto()
 */
export async function loginClientSide(args: LoginArgs): Promise<void> {
  const { customAdminRoutes, customRoutes, data = devUser, page, serverURL } = args
  const {
    routes: { admin: incomingAdminRoute } = {},
    admin: { routes: { login: incomingLoginRoute, createFirstUser } = {} },
  } = getRoutes({ customAdminRoutes, customRoutes })

  const adminRoute = formatAdminURL({ serverURL, adminRoute: incomingAdminRoute, path: '' })
  const loginRoute = formatAdminURL({
    serverURL,
    adminRoute: incomingAdminRoute,
    path: incomingLoginRoute,
  })
  const createFirstUserRoute = formatAdminURL({
    serverURL,
    adminRoute: incomingAdminRoute,
    path: createFirstUser,
  })

  if ((await page.locator('#nav-toggler').count()) > 0) {
    // a user is already logged in - log them out
    await openNav(page)
    await expect(page.locator('.nav__controls [aria-label="Log out"]')).toBeVisible()
    await page.locator('.nav__controls [aria-label="Log out"]').click()

    if (await page.locator('dialog#leave-without-saving').isVisible()) {
      await page.locator('dialog#leave-without-saving #confirm-action').click()
    }

    await page.waitForURL(loginRoute)
  }

  await wait(500)
  await page.fill('#field-email', data.email)
  await page.fill('#field-password', data.password)
  await wait(500)
  await page.click('[type=submit]')

  await expect(page.locator('.step-nav__home')).toBeVisible()
  if ((await page.locator('a.step-nav__home').count()) > 0) {
    await page.locator('a.step-nav__home').click()
  }

  await page.waitForURL(adminRoute)

  await expect(() => expect(page.url()).not.toContain(loginRoute)).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
  })
  await expect(() => expect(page.url()).not.toContain(createFirstUserRoute)).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
  })
}
