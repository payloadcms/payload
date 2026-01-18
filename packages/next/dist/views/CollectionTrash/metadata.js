import { getTranslation } from '@payloadcms/translations';
import { generateMetadata } from '../../utilities/meta.js';
export const generateCollectionTrashMetadata = async args => {
  const {
    collectionConfig,
    config,
    i18n
  } = args;
  let title = '';
  const description = '';
  const keywords = '';
  if (collectionConfig) {
    title = getTranslation(collectionConfig.labels.plural, i18n);
  }
  title = `${title ? `${title} ` : title}${i18n.t('general:trash')}`;
  return generateMetadata({
    ...(config.admin.meta || {}),
    description,
    keywords,
    serverURL: config.serverURL,
    title,
    ...(collectionConfig?.admin?.meta || {})
  });
};
//# sourceMappingURL=metadata.js.map