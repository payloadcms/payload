import { generateMetadata } from '../../utilities/meta.js';
export const generateResetPasswordViewMetadata = async ({
  config,
  i18n: {
    t
  }
}) => generateMetadata({
  description: t('authentication:resetPassword'),
  keywords: t('authentication:resetPassword'),
  serverURL: config.serverURL,
  title: t('authentication:resetPassword'),
  ...(config.admin.meta || {})
});
//# sourceMappingURL=metadata.js.map