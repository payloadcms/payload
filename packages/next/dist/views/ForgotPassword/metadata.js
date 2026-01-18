import { generateMetadata } from '../../utilities/meta.js';
export const generateForgotPasswordViewMetadata = async ({
  config,
  i18n: {
    t
  }
}) => generateMetadata({
  description: t('authentication:forgotPassword'),
  keywords: t('authentication:forgotPassword'),
  title: t('authentication:forgotPassword'),
  ...(config.admin.meta || {}),
  serverURL: config.serverURL
});
//# sourceMappingURL=metadata.js.map