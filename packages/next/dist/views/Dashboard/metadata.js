import { generateMetadata } from '../../utilities/meta.js';
export const generateDashboardViewMetadata = async ({
  config,
  i18n: {
    t
  }
}) => generateMetadata({
  serverURL: config.serverURL,
  title: t('general:dashboard'),
  ...config.admin.meta,
  openGraph: {
    title: t('general:dashboard'),
    ...(config.admin.meta?.openGraph || {})
  }
});
//# sourceMappingURL=metadata.js.map