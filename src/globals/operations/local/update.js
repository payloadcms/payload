async function update(options) {
  const {
    global: globalSlug,
    depth,
    locale,
    fallbackLocale,
    data,
  } = options;

  const globalConfig = this.globals.config.find((config) => config.slug === globalSlug);

  return this.operations.globals.update({
    slug: globalSlug,
    data,
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

module.exports = update;
