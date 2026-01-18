import { generateMetadata } from '../../utilities/meta.js';
export const generateUnauthorizedViewMetadata = async ({
  config,
  i18n: {
    t
  }
}) => generateMetadata({
  description: t('error:unauthorized'),
  keywords: t('error:unauthorized'),
  serverURL: config.serverURL,
  title: t('error:unauthorized'),
  ...(config.admin.meta || {})
});
//# sourceMappingURL=metadata.js.map