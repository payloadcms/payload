async function findOne(options) {
  const {
    global: globalSlug,
    depth,
    locale,
    fallbackLocale,
  } = options;

  const globalConfig = this.globals.config.find((config) => config.slug === globalSlug);

  return this.operations.globals.findOne({
    slug: globalSlug,
    depth,
    globalConfig,
    overrideAccess: true,
    req: {
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload: this,
    },
  });
}

module.exports = findOne;
