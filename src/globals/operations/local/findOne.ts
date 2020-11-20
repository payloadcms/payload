async function findOne(options) {
  const {
    global: globalSlug,
    depth,
    locale,
    fallbackLocale,
    user,
    overrideAccess = true,
    showHiddenFields,
  } = options;

  const globalConfig = this.globals.config.find((config) => config.slug === globalSlug);

  return this.operations.globals.findOne({
    slug: globalSlug,
    depth,
    globalConfig,
    overrideAccess,
    showHiddenFields,
    req: {
      user,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload: this,
    },
  });
}

module.exports = findOne;
