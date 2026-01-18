import { upsertPreferences } from '@payloadcms/ui/rsc';
import { findLocaleFromCode } from '@payloadcms/ui/shared';
import { getPreferences } from './getPreferences.js';
export async function getRequestLocale({
  req
}) {
  if (req.payload.config.localization) {
    const localeFromParams = req.query.locale;
    if (req.user && localeFromParams) {
      await upsertPreferences({
        key: 'locale',
        req,
        value: localeFromParams
      });
    }
    return req.user && findLocaleFromCode(req.payload.config.localization, localeFromParams || (await getPreferences('locale', req.payload, req.user.id, req.user.collection))?.value) || findLocaleFromCode(req.payload.config.localization, req.payload.config.localization.defaultLocale || 'en');
  }
  return undefined;
}
//# sourceMappingURL=getRequestLocale.js.map