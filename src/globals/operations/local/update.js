async function update(options) {
  const {
    global: globalSlug,
    depth,
    locale,
    fallbackLocale,
    data,
    user,
    overrideAccess = true,
  } = options;

  const globalConfig = this.globals.config.find((config) => config.slug === globalSlug);

  return this.operations.globals.update({
    slug: globalSlug,
    data,
    depth,
    globalConfig,
    overrideAccess,
    req: {
      user,
      payloadAPI: 'local',
      locale,
      fallbackLocale,
      payload: this,
    },
  });
}

module.exports = update;
