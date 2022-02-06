async function findOne(options) {
  const {
    slug: globalSlug,
    depth,
    locale = this?.config?.localization?.defaultLocale,
    fallbackLocale = null,
    user,
    overrideAccess = true,
    showHiddenFields,
    draft = false,
  } = options;

  const globalConfig = this.globals.config.find((config) => config.slug === globalSlug);

  return this.operations.globals.findOne({
    slug: globalSlug,
    depth,
    globalConfig,
    overrideAccess,
    showHiddenFields,
    draft,
    req: {
      user,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload: this,
    },
  });
}

export default findOne;
