import { initI18n } from '@payloadcms/translations';
import { cookies, headers } from 'next/headers.js';
import { getRequestLanguage } from 'payload';
/**
 * In the context of Next.js, this function initializes the i18n object for the current request.
 *
 * It must be called on the server side, and within the lifecycle of a request since it relies on the request headers and cookies.
 */
export const getNextRequestI18n = async ({
  config
}) => {
  return await initI18n({
    config: config.i18n,
    context: 'client',
    language: getRequestLanguage({
      config,
      cookies: await cookies(),
      headers: await headers()
    })
  });
};
//# sourceMappingURL=getNextRequestI18n.js.map