import { generateMetadata } from '../../utilities/meta.js';
export const generateNotFoundViewMetadata = async ({
  config,
  i18n
}) => generateMetadata({
  description: i18n.t('general:pageNotFound'),
  keywords: `404 ${i18n.t('general:notFound')}`,
  serverURL: config.serverURL,
  title: i18n.t('general:notFound')
});
//# sourceMappingURL=metadata.js.map