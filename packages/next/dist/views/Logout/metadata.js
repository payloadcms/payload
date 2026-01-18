import { generateMetadata } from '../../utilities/meta.js';
export const generateLogoutViewMetadata = async ({
  config,
  i18n: {
    t
  }
}) => generateMetadata({
  description: `${t('authentication:logoutUser')}`,
  keywords: `${t('authentication:logout')}`,
  serverURL: config.serverURL,
  title: t('authentication:logout')
});
//# sourceMappingURL=metadata.js.map