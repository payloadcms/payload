import type { SanitizedConfig } from 'payload'

type GetRequestEmbedArgs = {
  config: SanitizedConfig
  cookies: Map<string, string>
}

/**
 * Reads the embed cookie from the request so embed mode renders correctly on
 * first paint for any load once the cookie exists. The `?embed=true` query
 * parameter is handled client-side, because the root layout cannot see search
 * params.
 */
export const getRequestEmbed = ({ config, cookies }: GetRequestEmbedArgs): boolean =>
  cookies.get(`${config.cookiePrefix || 'payload'}-embed`) === 'true'
