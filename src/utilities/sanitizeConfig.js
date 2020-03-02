const sanitizeConfig = (config) => {
  const sanitizedConfig = { ...config };

  sanitizedConfig.routes = {
    admin: (config.routes && config.routes.admin) ? config.routes.admin : '/admin',
    api: (config.routes && config.routes.api) ? config.routes.api : '/api',
  };
  sanitizedConfig.components = { ...(config.components || {}) };

  return sanitizedConfig;
};

module.exports = sanitizeConfig;
