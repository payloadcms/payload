async function login(args) {
  const {
    collection: collectionSlug,
    req = {},
    res,
    depth,
    locale,
    fallbackLocale,
    data,
    overrideAccess = true,
    showHiddenFields,
  } = args;

  const collection = this.collections[collectionSlug];

  const options = {
    depth,
    collection,
    overrideAccess,
    showHiddenFields,
    data,
    req: {
      ...req,
      payloadAPI: 'local',
      payload: this,
    },
    res,
  };

  if (locale) options.req.locale = locale;
  if (fallbackLocale) options.req.fallbackLocale = fallbackLocale;

  return this.operations.collections.auth.login(options);
}

module.exports = login;
