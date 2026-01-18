import { initI18n } from '@payloadcms/translations';
import { headers as getHeaders } from 'next/headers.js';
import { createLocalReq, executeAuthStrategies, getAccessResults, getPayload, getRequestLanguage, parseCookies } from 'payload';
import { getRequestLocale } from './getRequestLocale.js';
import { selectiveCache } from './selectiveCache.js';
// Create cache instances for different parts of our application
const partialReqCache = selectiveCache('partialReq');
const reqCache = selectiveCache('req');
/**
 * Initializes a full request object, including the `req` object and access control.
 * As access control and getting the request locale is dependent on the current URL and
 */
export const initReq = async function ({
  canSetHeaders,
  configPromise,
  importMap,
  key,
  overrides
}) {
  const headers = await getHeaders();
  const cookies = parseCookies(headers);
  const partialResult = await partialReqCache.get(async () => {
    const config = await configPromise;
    const payload = await getPayload({
      config,
      cron: true,
      importMap
    });
    const languageCode = getRequestLanguage({
      config,
      cookies,
      headers
    });
    const i18n = await initI18n({
      config: config.i18n,
      context: 'client',
      language: languageCode
    });
    const {
      responseHeaders,
      user
    } = await executeAuthStrategies({
      canSetHeaders,
      headers,
      payload
    });
    return {
      i18n,
      languageCode,
      payload,
      responseHeaders,
      user
    };
  }, 'global');
  return reqCache.get(async () => {
    const {
      i18n,
      languageCode,
      payload,
      responseHeaders,
      user
    } = partialResult;
    const {
      req: reqOverrides,
      ...optionsOverrides
    } = overrides || {};
    const req = await createLocalReq({
      req: {
        headers,
        host: headers.get('host'),
        i18n: i18n,
        responseHeaders,
        user,
        ...(reqOverrides || {})
      },
      ...(optionsOverrides || {})
    }, payload);
    const locale = await getRequestLocale({
      req
    });
    req.locale = locale?.code;
    const permissions = await getAccessResults({
      req
    });
    return {
      cookies,
      headers,
      languageCode,
      locale,
      permissions,
      req
    };
  }, key).then(result => {
    // CRITICAL: Create a shallow copy of req before returning to prevent
    // mutations from propagating to the cached req object.
    // This ensures parallel operations using the same cache key don't affect each other.
    return {
      ...result,
      req: {
        ...result.req,
        ...(result.req?.context ? {
          context: {
            ...result.req.context
          }
        } : {})
      }
    };
  });
};
//# sourceMappingURL=initReq.js.map