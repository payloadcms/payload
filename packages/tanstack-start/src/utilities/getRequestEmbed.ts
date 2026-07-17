import type { SanitizedConfig } from 'payload'

type GetRequestEmbedArgs = {
  config: SanitizedConfig
  cookies: Map<string, string>
}

export function getRequestEmbed({ config, cookies }: GetRequestEmbedArgs): boolean {
  return cookies.get(`${config.cookiePrefix || 'payload'}-embed`) === 'true'
}
