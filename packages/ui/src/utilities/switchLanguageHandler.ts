import type { ServerFunction } from 'payload'

type SwitchLanguageArgs = {
  lang: string
}

/**
 * Server-function dispatched from {@link TranslationProvider} when the user switches
 * the admin language. Writes the language cookie via the request's `ServerAdapter`,
 * which avoids closing over framework-specific bindings in a client-callable server
 * action (see `slugifyHandler` JSDoc for the broader pattern).
 */
export const switchLanguageHandler: ServerFunction<SwitchLanguageArgs, Promise<void>> = async ({
  lang,
  req,
}) => {
  const cookieName = `${req.payload.config.cookiePrefix || 'payload'}-lng`

  await req.server.setCookie(cookieName, lang, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
}
