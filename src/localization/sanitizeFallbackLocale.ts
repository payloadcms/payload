const sanitizeFallbackLocale = (fallbackLocale) => {
  if (fallbackLocale === 'null' || fallbackLocale === 'none' || fallbackLocale === 'false' || fallbackLocale === false) {
    return null;
  }

  return fallbackLocale;
};

export default sanitizeFallbackLocale;
