const sanitizeFallbackLocale = (fallbackLocale) => {
  if (fallbackLocale === 'null' || fallbackLocale === 'none' || fallbackLocale === 'false' || fallbackLocale === false) {
    return null;
  }

  return fallbackLocale;
};

module.exports = sanitizeFallbackLocale;
