import { generateMetadata } from '../../utilities/meta.js';
export const generateBrowseByFolderMetadata = async args => {
  const {
    config,
    i18n
  } = args;
  const title = i18n.t('folder:browseByFolder');
  const description = '';
  const keywords = '';
  return generateMetadata({
    ...(config.admin.meta || {}),
    description,
    keywords,
    serverURL: config.serverURL,
    title
  });
};
//# sourceMappingURL=metadata.js.map