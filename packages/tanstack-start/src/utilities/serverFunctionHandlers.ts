import type { ServerFunction } from 'payload'

/**
 * Framework-agnostic server-function handlers the TanStack Start dispatcher
 * registers to reach parity with the Next.js adapter
 * (`packages/next/src/utilities/handleServerFunctions.ts`).
 */

type SwitchLanguageArgs = {
  lang: string
}

/**
 * Dispatched from `TranslationProvider` when the user switches the admin
 * language. Writes the `<cookiePrefix>-lng` cookie via the request's
 * `ServerAdapter` (wired up in `initReq`) so the next render — triggered by
 * the provider's `router.refresh()` — reads the new language.
 */
export const switchLanguageHandler: ServerFunction<SwitchLanguageArgs, Promise<void>> = async ({
  lang,
  req,
}) => {
  if (!req.server) {
    throw new Error('switch-language requires a ServerAdapter on the request')
  }

  const cookieName = `${req.payload.config.cookiePrefix || 'payload'}-lng`

  await req.server.setCookie(cookieName, lang, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
}
