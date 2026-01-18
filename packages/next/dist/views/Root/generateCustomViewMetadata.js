import { generateMetadata } from '../../utilities/meta.js';
export const generateCustomViewMetadata = async args => {
  const {
    config,
    // i18n: { t },
    viewConfig
  } = args;
  if (!viewConfig) {
    return null;
  }
  return generateMetadata({
    description: `Payload`,
    keywords: `Payload`,
    serverURL: config.serverURL,
    title: 'Payload',
    ...(config.admin.meta || {}),
    ...(viewConfig.meta || {}),
    openGraph: {
      title: 'Payload',
      ...(config.admin.meta?.openGraph || {}),
      ...(viewConfig.meta?.openGraph || {})
    }
  });
};
//# sourceMappingURL=generateCustomViewMetadata.js.map