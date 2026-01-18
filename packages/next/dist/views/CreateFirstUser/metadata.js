import { generateMetadata } from '../../utilities/meta.js';
export const generateCreateFirstUserViewMetadata = async ({
  config,
  i18n: {
    t
  }
}) => generateMetadata({
  description: t('authentication:createFirstUser'),
  keywords: t('general:create'),
  serverURL: config.serverURL,
  title: t('authentication:createFirstUser'),
  ...(config.admin.meta || {})
});
//# sourceMappingURL=metadata.js.map