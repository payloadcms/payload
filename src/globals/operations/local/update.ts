async function update(options) {
  const {
    slug: globalSlug,
    depth,
    locale = this?.config?.localization?.defaultLocale,
    fallbackLocale = null,
    data,
    user,
    overrideAccess = true,
    showHiddenFields,
    draft,
  } = options;

  const globalConfig = this.globals.config.find((config) => config.slug === globalSlug);

  return this.operations.globals.update({
    slug: globalSlug,
    data,
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

export default update;
