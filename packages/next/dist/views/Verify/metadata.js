import { generateMetadata } from '../../utilities/meta.js';
export const generateVerifyViewMetadata = async ({
  config,
  i18n: {
    t
  }
}) => generateMetadata({
  description: t('authentication:verifyUser'),
  keywords: t('authentication:verify'),
  serverURL: config.serverURL,
  title: t('authentication:verify'),
  ...(config.admin.meta || {})
});
//# sourceMappingURL=metadata.js.map