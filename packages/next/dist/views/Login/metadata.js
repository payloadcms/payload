import { generateMetadata } from '../../utilities/meta.js';
export const generateLoginViewMetadata = async ({
  config,
  i18n: {
    t
  }
}) => generateMetadata({
  description: `${t('authentication:login')}`,
  keywords: `${t('authentication:login')}`,
  serverURL: config.serverURL,
  title: t('authentication:login'),
  ...(config.admin.meta || {})
});
//# sourceMappingURL=metadata.js.map