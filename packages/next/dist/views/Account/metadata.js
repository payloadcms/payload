import { generateMetadata } from '../../utilities/meta.js';
export const generateAccountViewMetadata = async ({
  config,
  i18n: {
    t
  }
}) => generateMetadata({
  description: `${t('authentication:accountOfCurrentUser')}`,
  keywords: `${t('authentication:account')}`,
  serverURL: config.serverURL,
  title: t('authentication:account'),
  ...(config.admin.meta || {})
});
//# sourceMappingURL=metadata.js.map