'use server'

import { nextServerAdapter } from './server.js'

export async function switchLanguageAction(cookieName: string, lang: string): Promise<void> {
  await nextServerAdapter.setCookie(cookieName, lang, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
}
